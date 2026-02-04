"use client";

import { useState, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useSystemPrompt } from "./useSystemPrompt";

export interface GeminiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parentId?: string;
}

export function useGemini() {
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
        const model = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
          systemInstruction: systemPrompt || fallbackSystemPrompt,
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
    [systemPrompt],
  );

  return { messages, loading, error, sendMessage };
}

export type UseGeminiReturn = ReturnType<typeof useGemini>;
