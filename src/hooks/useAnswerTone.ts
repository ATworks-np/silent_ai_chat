import { useCallback, useState } from "react";

export type AnswerTone = "casual" | "normal" | "strict";

export interface AnswerToneState {
  tone: AnswerTone;
}

export interface UseAnswerToneResult {
  state: AnswerToneState;
  setTone: (tone: AnswerTone) => void;
}

export function useAnswerTone(initialTone: AnswerTone = "normal"): UseAnswerToneResult {
  const [state, setState] = useState<AnswerToneState>({ tone: initialTone });

  const setTone = useCallback((tone: AnswerTone) => {
    setState({ tone });
  }, []);

  return { state, setTone };
}
