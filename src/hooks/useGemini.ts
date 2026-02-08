"use client";

import { useState, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSystemPrompt } from "./useSystemPrompt";
import type { AnswerQuality, AnswerTone } from "./useChatSettings";
import { useConversationPersistence } from "./useConversationPersistence";
import { useMessages } from "./useMessages";
import useUser from "@/hooks/useUser";

export interface GeminiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parentId?: string;
  // Geminiの回答に対して、次に取るべきアクション候補（最大2件）
  suggestedActions?: string[];
}

export interface UseGeminiOptions {
  quality: AnswerQuality;
  tone: AnswerTone;
}

export interface GeminiTokenUsage {
  promptTokenCount: number;
  candidatesTokenCount: number;
  thoughtsTokenCount: number;
  totalTokenCount: number;
}

function buildQualityInstruction(quality: AnswerQuality): string {
  if (quality === "simple") {
    return "回答は必要最小限の情報のみを簡潔に記述してください。詳細な背景説明や長い前置きは避け、核心部分だけを短くまとめてください。";
  }

  if (quality === "detailed") {
    return "質問に関連する前提や背景、理由や注意点も含めて、丁寧かつ詳細に説明してください。段落や箇条書きを使い、順序立ててわかりやすく整理してください。";
  }

  // normal
  return "質問の意図を踏まえつつ、過不足のない標準的な情報量で回答してください。重要なポイントを中心に、必要な補足だけを簡潔に示してください。";
}

function buildToneInstruction(tone: AnswerTone): string {
  if (tone === "casual") {
    return "文体はフレンドリーで柔らかいカジュアルな日本語にしてください。ただし絵文字や過度な崩し表現は使わず、丁寧さは維持してください。";
  }

  if (tone === "strict") {
    return "文体はフォーマルで論理的な日本語にしてください。主観的な表現は避け、事実と根拠を中心に、丁寧でかっちりとした書き方を心がけてください。";
  }

  // normal
  return "文体は一般的なビジネス寄りの自然な日本語にしてください。堅すぎず砕けすぎず、読みやすさを優先してください。";
}

export function useGemini({ quality, tone }: UseGeminiOptions) {
  const { messages, setMessages, loading: messagesLoading } = useMessages();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTokenUsage, setLastTokenUsage] = useState<GeminiTokenUsage | null>(null);
  const { content: systemPrompt } = useSystemPrompt();
  const { user } = useUser();
  const { ensureAndSaveTurn } = useConversationPersistence({ userId: user.props.uid ?? null });

  const sendMessage = useCallback(
    async (userMessage: string, parentId?: string, assistantIdOverride?: string) => {
      if (!userMessage.trim()) return;

      setLoading(true);
      setError(null);

      try {
        // 1. これまでの会話履歴を contents 配列として組み立てる（必要に応じて）
        // parentId が指定されている場合は、その「回答」と、その先祖（親・祖父…）にあたる回答および
        // それぞれを導いた直近のユーザーメッセージを、古いものから順にコンテキストとして含める
        let historyContents: Array<{ role: "user" | "model"; parts: { text: string }[] }> = [];

        if (parentId && messages.length > 0) {
          const parentIndex = messages.findIndex((m) => m.id === parentId);

          if (parentIndex !== -1) {
            const chain: typeof messages = [];

            // いまの回答から親・祖父…とさかのぼって、回答チェーンを作る
            let currentAssistant = messages[parentIndex];

            // 念のため role チェック（user の id が parentId に来ることは通常想定しない）
            while (currentAssistant) {
              const currentIndex = messages.findIndex((m) => m.id === currentAssistant.id);

              // この回答に直接つながる直近のユーザーメッセージを特定
              const relatedUserMessages = messages.filter((m, index) => (
                index < currentIndex &&
                m.role === "user" &&
                m.parentId === currentAssistant.parentId
              ));

              const sourceUser =
                relatedUserMessages.length > 0
                  ? relatedUserMessages[relatedUserMessages.length - 1]
                  : null;

              if (sourceUser) {
                chain.push(sourceUser);
              }
              chain.push(currentAssistant);

              // さらに上の先祖の回答（parentId をたどる）を探す
              if (!currentAssistant.parentId) {
                break;
              }

              const nextAssistant = messages.find(
                (m) => m.id === currentAssistant.parentId && m.role === "assistant",
              );

              if (!nextAssistant) {
                break;
              }

              currentAssistant = nextAssistant;
            }

            // 古い先祖から順に並ぶように反転
            const orderedChain = chain.reverse();

            historyContents = orderedChain.map((m) => ({
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.content }],
            }));
          }
        }

        // モデルには、通常の回答に加えて「次にするアクション」2つも同時に返すよう指示する
        const formatInstruction = [
          "---",
          "出力形式:",
          "1. まず通常の回答本文のみを出力する。",
          "2. 1行空けてから'次にするアクション:'という見出しを1行で出力する。",
          "3. その直下に、ユーザーが次に取りうるアクションを日本語で2つ提案する。",
          "4. 各アクションは1文(20文字以内)の体言止めとし、箇条書きの番号や記号（1. や ・ など）は付けない。",
          "5. アクションはちょうど2行とし、1行目に1つ目、2行目に2つ目のアクションを書く。",
        ].join("\n");

        const finalUserText = [
          userMessage,
          "",
          formatInstruction,
        ].join("\n");

        const contents = [
          ...historyContents,
          {
            role: "user" as const,
            parts: [{ text: finalUserText }],
          },
        ];

        // 2. いまのユーザーメッセージを state に追加
        const userMessageId = `user-${Date.now()}-${Math.random()}`;
        const newUserMessage: GeminiMessage = {
          id: userMessageId,
          role: "user",
          content: userMessage,
          parentId,
        };
        setMessages((prev) => [...prev, newUserMessage]);

        const assistantId = assistantIdOverride || `assistant-${Date.now()}-${Math.random()}`;

        // Initialize Gemini API
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const basePrompt = systemPrompt;
        const qualityInstruction = buildQualityInstruction(quality);
        const toneInstruction = buildToneInstruction(tone);

        const finalSystemPrompt = `${basePrompt}\n\n---\n出力スタイル設定:\n${qualityInstruction}\n${toneInstruction}`.trim();

        // 利用するモデル名（履歴にも保存する）
        const modelName = "gemini-3-flash-preview";

        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: finalSystemPrompt,
        });

        const result = await model.generateContent({ contents });
        const response = await result.response;
        const rawText = response.text();

        console.log(response);

        // モデルからの返却テキストを「本文」と「次にするアクション」に分解する
        const delimiter = "次にするアクション:";
        let text = rawText;
        let suggestedActions: string[] | undefined;

        const delimiterIndex = rawText.indexOf(delimiter);

        if (delimiterIndex !== -1) {
          text = rawText.slice(0, delimiterIndex).trim();

          const actionsPart = rawText.slice(delimiterIndex + delimiter.length).trim();
          const actionLines = actionsPart
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

          suggestedActions = actionLines.slice(0, 2);
        }

        // トークン使用量を取得（利用可能な場合のみ）
        const usage = (response as unknown as {
          usageMetadata?: {
            promptTokenCount?: number;
            candidatesTokenCount?: number;
            thoughtsTokenCount?: number;
            totalTokenCount?: number;
          };
        }).usageMetadata;

        if (usage) {
          const usageValue: GeminiTokenUsage = {
            promptTokenCount: usage.promptTokenCount ?? 0,
            candidatesTokenCount: usage.candidatesTokenCount ?? 0,
            thoughtsTokenCount: usage.thoughtsTokenCount ?? 0,
            totalTokenCount: usage.totalTokenCount ?? 0,
          };

          setLastTokenUsage(usageValue);

          // Firestore に会話履歴を保存（本文とアクションを分けて保存）
          await ensureAndSaveTurn({
            userContent: userMessage,
            assistantContent: text,
            tokenUsage: usageValue,
            userMessageId,
            assistantMessageId: assistantId,
            parentMessageId: parentId ?? null,
            actions: suggestedActions,
            modelName,
          });
        } else {
          setLastTokenUsage(null);
        }

        // Add assistant message
        const newAssistantMessage: GeminiMessage = {
          id: assistantId,
          role: "assistant",
          content: text,
          parentId,
          suggestedActions,
        };
        setMessages((prev) => [...prev, newAssistantMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Gemini API error:", err);
      } finally {
        setLoading(false);
      }
    },
    [systemPrompt, quality, tone, messages],
  );

  return { messages, loading, error, sendMessage, lastTokenUsage, messagesLoading };
}

export type UseGeminiReturn = ReturnType<typeof useGemini>;
