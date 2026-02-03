"use client";

import { useState, useCallback } from "react";
import type { ChatInput } from "../types/chat";

export function useChatInput(initial: ChatInput = { text: "" }) {
  const [value, setValue] = useState<ChatInput>(initial);

  const onChange = useCallback((text: string) => {
    setValue({ text });
  }, []);

  const reset = useCallback(() => setValue({ text: "" }), []);

  return { value, onChange, reset };
}

export type UseChatInputReturn = ReturnType<typeof useChatInput>;
