"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, type Timestamp } from "firebase/firestore";
import { db } from "@/libs/firebase";
import useUser from "@/hooks/useUser";
import type { GeminiMessage } from "@/hooks/useGemini";
import type { MessageDoc } from "@/hooks/useConversationPersistence";

interface UseMessagesState {
  messages: GeminiMessage[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export function useMessages() {
  const { user } = useUser();
  const [state, setState] = useState<UseMessagesState>({
    messages: [],
    loading: false,
    error: null,
    initialized: false,
  });

  useEffect(() => {
    const uid = user.props.uid;

    // 未ログインの場合はメッセージを空にして完了扱いにする
    if (!uid) {
      setState({
        messages: [],
        loading: false,
        error: null,
        initialized: true,
      });
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const messagesCollection = collection(db, "users", uid, "messages");
        const q = query(messagesCollection, orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);

        if (cancelled) return;

        const docs = snapshot.docs.map((doc) => doc.data() as MessageDoc);

        const messages: GeminiMessage[] = docs.map((doc) => ({
          id: doc.messageId,
          role: doc.role === "user" ? "user" : "assistant",
          content: doc.content,
          parentId: doc.parentMessageId ?? undefined,
          // Firestore に保存した actions を assistant メッセージの suggestedActions として復元
          suggestedActions: doc.role === "model" && doc.actions ? doc.actions : undefined,
        }));


        setState({
          messages,
          loading: false,
          error: null,
          initialized: true,
        });
      } catch (err) {
        if (cancelled) return;

        const message = err instanceof Error ? err.message : "履歴の読み込みに失敗しました";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
          initialized: true,
        }));
      }
    };

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [user.props.uid]);

  return {
    messages: state.messages,
    setMessages: (updater: React.SetStateAction<GeminiMessage[]>) => {
      setState((prev) => ({
        ...prev,
        messages: typeof updater === "function" ? (updater as (m: GeminiMessage[]) => GeminiMessage[])(prev.messages) : updater,
      }));
    },
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
  };
}
