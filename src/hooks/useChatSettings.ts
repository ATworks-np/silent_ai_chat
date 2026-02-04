"use client";

import { useState } from "react";

export type AnswerQuality = "simple" | "normal" | "detailed";

export type AnswerTone = "casual" | "normal" | "strict";

export interface ChatSettingsState {
  quality: AnswerQuality;
  tone: AnswerTone;
}

export interface UseChatSettingsResult extends ChatSettingsState {
  setQuality: (quality: AnswerQuality) => void;
  setTone: (tone: AnswerTone) => void;
}

export function useChatSettings(): UseChatSettingsResult {
  const [quality, setQuality] = useState<AnswerQuality>("normal");
  const [tone, setTone] = useState<AnswerTone>("normal");

  return { quality, tone, setQuality, setTone };
}
