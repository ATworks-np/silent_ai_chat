import { useCallback, useState } from "react";

export type AnswerQuality = "simple" | "normal" | "detailed";

export interface AnswerQualityState {
  quality: AnswerQuality;
}

export interface UseAnswerQualityResult {
  state: AnswerQualityState;
  setQuality: (quality: AnswerQuality) => void;
}

export function useAnswerQuality(initialQuality: AnswerQuality = "normal"): UseAnswerQualityResult {
  const [state, setState] = useState<AnswerQualityState>({ quality: initialQuality });

  const setQuality = useCallback((quality: AnswerQuality) => {
    setState({ quality });
  }, []);

  return { state, setQuality };
}
