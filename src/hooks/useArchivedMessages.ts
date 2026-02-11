"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/libs/firebase";
import useUser from "@/hooks/useUser";
import type { ArchiveMessage } from "@/models/interfaces/archive";
import type { MessageDoc } from "@/models/interfaces/message";

interface UseArchivedMessagesState {
  messages: ArchiveMessage[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export function useArchivedMessages() {
  const { user } = useUser();
  const [state, setState] = useState<UseArchivedMessagesState>({
    messages: [],
    loading: false,
    error: null,
    initialized: false,
  });

  useEffect(() => {
    const uid = user.props.uid;

    if (!uid) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const messagesCollection = collection(db, "users", uid, "messages");
        // archive == true のみをクエリし、parentMessageId はクライアント側で root のみ抽出
        const q = query(messagesCollection, where("archive", "==", true), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        if (cancelled) return;

        const docs = snapshot.docs
          .map((doc) => doc.data() as MessageDoc)
          .filter((doc) => !doc.deleted);

        const roots = docs.filter((d) => d.parentMessageId === null && d.role === "user");

        const messages: ArchiveMessage[] = roots.map((d) => ({
          messageId: d.messageId,
          content: d.content,
          createdAt: d.createdAt,
        }));

        setState({ messages, loading: false, error: null, initialized: true });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "アーカイブの読み込みに失敗しました";
        setState((prev) => ({ ...prev, loading: false, error: message, initialized: true }));
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [user.props.uid]);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
  };
}
