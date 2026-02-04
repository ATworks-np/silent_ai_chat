"use client";

import { useState, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSystemPrompt } from "./useSystemPrompt";
import type { AnswerQuality, AnswerTone } from "./useChatSettings";

export interface GeminiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parentId?: string;
}

export interface UseGeminiOptions {
  quality: AnswerQuality;
  tone: AnswerTone;
}

export function useGemini({ quality, tone }: UseGeminiOptions) {
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { content: systemPrompt } = useSystemPrompt();

  const fallbackSystemPrompt =
    "質問に対して必要最小限の情報のみを簡潔に回答してください。前置き、導入文、補足説明、背景情報は一切不要です。質問された内容に直接答える核心部分のみを端的に記述してください。冗長な表現や装飾的な言葉は避け、事実を箇条書きまたは短い文で述べてください。";

  const sendMessage = useCallback(
    async (userMessage: string, parentId?: string, assistantIdOverride?: string) => {
      if (!userMessage.trim()) return;

      setLoading(true);
      setError(null);

      try {
        // Add user message
        const userId = `user-${Date.now()}-${Math.random()}`;
        const newUserMessage: GeminiMessage = {
          id: userId,
          role: "user",
          content: userMessage,
          parentId,
        };
        setMessages((prev) => [...prev, newUserMessage]);

        // Initialize Gemini API
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const basePrompt = systemPrompt || fallbackSystemPrompt;

        let qualityInstruction = "";
        if (quality === "simple") {
          qualityInstruction =
            "回答は必要最小限の情報のみを簡潔に記述してください。詳細な背景説明や長い前置きは避け、核心部分だけを短くまとめてください。";
        } else if (quality === "normal") {
          qualityInstruction =
            "質問の意図を踏まえつつ、過不足のない標準的な情報量で回答してください。重要なポイントを中心に、必要な補足だけを簡潔に示してください。";
        } else if (quality === "detailed") {
          qualityInstruction =
            "質問に関連する前提や背景、理由や注意点も含めて、丁寧かつ詳細に説明してください。段落や箇条書きを使い、順序立ててわかりやすく整理してください。";
        }

        let toneInstruction = "";
        if (tone === "casual") {
          toneInstruction =
            "文体はフレンドリーで柔らかいカジュアルな日本語にしてください。ただし絵文字や過度な崩し表現は使わず、丁寧さは維持してください。";
        } else if (tone === "normal") {
          toneInstruction =
            "文体は一般的なビジネス寄りの自然な日本語にしてください。堅すぎず砕けすぎず、読みやすさを優先してください。";
        } else if (tone === "strict") {
          toneInstruction =
            "文体はフォーマルで論理的な日本語にしてください。主観的な表現は避け、事実と根拠を中心に、丁寧でかっちりとした書き方を心がけてください。";
        }

        const finalSystemPrompt = `${basePrompt}\n\n---\n出力スタイル設定:\n${qualityInstruction}\n${toneInstruction}`.trim();

        const model = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
          systemInstruction: finalSystemPrompt,
        });

        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();

        // Add assistant message
        const assistantId = assistantIdOverride || `assistant-${Date.now()}-${Math.random()}`;
        const newAssistantMessage: GeminiMessage = {
          id: assistantId,
          role: "assistant",
          content: text,
          parentId,
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
    [systemPrompt, quality, tone],
  );

  return { messages, loading, error, sendMessage };
}

export type UseGeminiReturn = ReturnType<typeof useGemini>;
