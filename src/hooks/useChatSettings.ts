"use client";

import { useState } from "react";

export type AnswerQuality = "simple" | "normal" | "detailed";

export type AnswerTone = "casual" | "normal" | "strict";

export type ChatSendMethod = "enter" | "ctrlEnter";

export interface ChatSettingsState {
  quality: AnswerQuality;
  tone: AnswerTone;
  sendMethod: ChatSendMethod;
}

export interface UseChatSettingsResult extends ChatSettingsState {
  setQuality: (quality: AnswerQuality) => void;
  setTone: (tone: AnswerTone) => void;
  setSendMethod: (method: ChatSendMethod) => void;
}

export function useChatSettings(): UseChatSettingsResult {
  const [quality, setQuality] = useState<AnswerQuality>("normal");
  const [tone, setTone] = useState<AnswerTone>("normal");
  const [sendMethod, setSendMethod] = useState<ChatSendMethod>("enter");

  return { quality, tone, sendMethod, setQuality, setTone, setSendMethod };
}
