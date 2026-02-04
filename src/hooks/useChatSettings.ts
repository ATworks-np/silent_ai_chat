"use client";

import type { ReactNode } from "react";
import { createContext, createElement, useContext, useMemo, useState } from "react";

export type AnswerQuality = "simple" | "normal" | "detailed";

export type AnswerTone = "casual" | "normal" | "strict";

export interface ChatSettingsState {
  quality: AnswerQuality;
  tone: AnswerTone;
}

export interface ChatSettingsContextValue extends ChatSettingsState {
  setQuality: (quality: AnswerQuality) => void;
  setTone: (tone: AnswerTone) => void;
}

const ChatSettingsContext = createContext<ChatSettingsContextValue | undefined>(undefined);

export interface ChatSettingsProviderProps {
  children: ReactNode;
}

export function ChatSettingsProvider({ children }: ChatSettingsProviderProps) {
  const [quality, setQuality] = useState<AnswerQuality>("normal");
  const [tone, setTone] = useState<AnswerTone>("normal");

  const value = useMemo<ChatSettingsContextValue>(
    () => ({ quality, tone, setQuality, setTone }),
    [quality, tone],
  );

  return createElement(ChatSettingsContext.Provider, { value }, children);
}

export function useChatSettings(): ChatSettingsContextValue {
  const context = useContext(ChatSettingsContext);

  if (!context) {
    return {
      quality: "normal",
      tone: "normal",
      setQuality: () => {},
      setTone: () => {},
    };
  }

  return context;
}
