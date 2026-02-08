"use client";

import { useCallback } from "react";
import { addDoc, collection, serverTimestamp, type Timestamp } from "firebase/firestore";
import { db } from "@/libs/firebase";
import type { GeminiTokenUsage } from "@/hooks/useGemini";

export interface MessageDoc {
  // メッセージ本体
  role: "user" | "model";
  content: string;
  tokens: number;
  createdAt: Timestamp;

  // ツリー構造のための情報
  messageId: string;
  parentMessageId: string | null;

  // モデルメッセージに紐づく「次にするアクション」候補
  // user メッセージの場合は null
  actions: string[] | null;

  // このメッセージ生成時に使用したモデル名
  // user / model 双方で、このメッセージ生成時に使用したモデル名を記録する
  modelName: string | null;
}

interface UseConversationPersistenceOptions {
  userId: string | null;
}

interface EnsureAndSaveTurnParams {
  userContent: string;
  assistantContent: string;
  tokenUsage: GeminiTokenUsage;
  userMessageId: string;
  assistantMessageId: string;
  parentMessageId: string | null;
  actions?: string[] | null;
  modelName: string;
}

interface UseConversationPersistenceReturn {
  ensureAndSaveTurn: (params: EnsureAndSaveTurnParams) => Promise<void>;
}

export function useConversationPersistence({
  userId,
}: UseConversationPersistenceOptions): UseConversationPersistenceReturn {
  const ensureAndSaveTurn = useCallback(
    async ({
      userContent,
      assistantContent,
      tokenUsage,
      userMessageId,
      assistantMessageId,
      parentMessageId,
      actions,
      modelName,
    }: EnsureAndSaveTurnParams) => {
      if (!userId) return;

      const messagesCollection = collection(db, "users", userId, "messages");

      const userMessage: MessageDoc = {
        role: "user",
        content: userContent,
        tokens: tokenUsage.promptTokenCount,
        createdAt: serverTimestamp() as unknown as Timestamp,
        messageId: userMessageId,
        parentMessageId,
        actions: null,
        modelName,
      };

      const modelMessage: MessageDoc = {
        role: "model",
        content: assistantContent,
        tokens: tokenUsage.candidatesTokenCount + tokenUsage.thoughtsTokenCount,
        createdAt: serverTimestamp() as unknown as Timestamp,
        messageId: assistantMessageId,
        // assistant メッセージの親は、GeminiMessage の parentId と同じ意味に揃える
        // （ルート回答なら null、子回答なら親 assistant の messageId）
        parentMessageId,
        actions: actions && actions.length > 0 ? actions : null,
        modelName,
      };

      await addDoc(messagesCollection, userMessage);
      await addDoc(messagesCollection, modelMessage);
    },
    [userId],
  );

  return {
    ensureAndSaveTurn,
  };
}
