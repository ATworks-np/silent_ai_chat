"use client";

import { useState, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSystemPrompt } from "./useSystemPrompt";
import type { AnswerQuality, AnswerTone } from "./useChatSettings";
import { useConversationPersistence } from "./useConversationPersistence";
import { useMessages } from "./useMessages";
import useUser from "@/hooks/useUser";
import {sendGemini} from "@/services/gemini";

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

        const contents = [
          ...historyContents,
          {
            role: "user" as const,
            parts: [{ text: userMessage }],
          },
        ];



        const basePrompt = systemPrompt;
        const qualityInstruction = buildQualityInstruction(quality);
        const toneInstruction = buildToneInstruction(tone);

        const finalSystemPrompt = `${basePrompt}\n\n---\n出力スタイル設定:\n${qualityInstruction}\n${toneInstruction}`.trim();

        const resualt = await sendGemini({
          userId: user.props.uid || "",
          parentId: parentId,
          modelName: "gemini-3-flash-preview",
          finalSystemPrompt: finalSystemPrompt,
          contents: contents
        })

        if (!resualt) throw('Error');

        const newUserMessage: GeminiMessage = {
          id: resualt.userMessageId,
          role: "user",
          content: userMessage,
          parentId,
        };
        setMessages((prev) => [...prev, newUserMessage]);

        const newAssistantMessage: GeminiMessage = {
          id: resualt.assistantMessageId,
          role: "assistant",
          content: resualt.assistantContent,
          parentId,
          suggestedActions: resualt.actions,
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
