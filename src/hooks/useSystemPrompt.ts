"use client";

import { useEffect, useState } from "react";

export interface SystemPromptState {
  content: string;
  loading: boolean;
  error: string | null;
}

export function useSystemPrompt(): SystemPromptState {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPrompt = async () => {
      try {
        const res = await fetch("/prompts/ai-system-prompt.md");
        if (!res.ok) {
          throw new Error(`Failed to load system prompt: ${res.status}`);
        }
        const text = await res.text();
        if (isMounted) {
          setContent(text.trim());
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPrompt();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, loading, error };
}
