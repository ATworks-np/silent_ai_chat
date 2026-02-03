"use client";

import { useState, useCallback } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { useChatInput } from "../hooks/useChatInput";
import { useGemini } from "../hooks/useGemini";
import ChatInputForm from "./ChatInputForm";
import MessageList from "./MessageList";
import DetailPopover from "./DetailPopover";
import LoadingIndicator from "./LoadingIndicator";

interface HighlightedSelection {
  messageId: string;
  text: string;
  childMessageId: string;
}

export default function ChatBox() {
  const { value, onChange, reset } = useChatInput();
  const { messages, loading, error, sendMessage } = useGemini();
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [highlights, setHighlights] = useState<HighlightedSelection[]>([]);
  const [hoveredChildId, setHoveredChildId] = useState<string>("");

  const handleTextSelect = useCallback((messageId: string) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0 && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // コードブロックやインラインコード内の選択はハイライト対象にしない
      const container = range.commonAncestorContainer as Node;
      const element =
        container.nodeType === Node.ELEMENT_NODE
          ? (container as HTMLElement)
          : (container.parentElement as HTMLElement | null);

      if (element && element.closest("code, pre")) {
        return;
      }

      const rect = range.getBoundingClientRect();

      setSelectedText(text);
      setSelectedMessageId(messageId);
      setAnchorPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, []);

  const handleClosePopover = useCallback(() => {
    setAnchorPosition(null);
    setSelectedText("");
    setSelectedMessageId("");
  }, []);

  const handleMoreDetails = useCallback(async () => {
    if (!selectedText || !selectedMessageId) return;
    
    handleClosePopover();
    
    // Generate child message ID before sending
    const childMessageId = `assistant-${Date.now()}-${Math.random()}`;

    // Add to highlights (parent messageに対する選択テキストと、これから生成される子メッセージIDを紐づける)
    setHighlights((prev) => [
      ...prev,
      {
        messageId: selectedMessageId,
        text: selectedText,
        childMessageId,
      },
    ]);

    // Gemini側のassistantメッセージIDもchildMessageIdで固定して、ホバー時にPaper背景色と一致させる
    await sendMessage(
      `「${selectedText}」についてもっと詳しく教えてください。`,
      selectedMessageId,
      childMessageId,
    );
  }, [selectedText, selectedMessageId, sendMessage, handleClosePopover]);

  const handleNotResolved = useCallback(async (messageId: string, content: string) => {
    await sendMessage(`以下の回答では解決していません。別の視点から詳しく教えてください。\n\n${content}`, messageId);
  }, [sendMessage]);

  const open = Boolean(anchorPosition);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.text.trim() || loading) return;
    
    await sendMessage(value.text);
    reset();
  };

  return (
    <>
      <Stack alignItems="center" spacing={2} sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 2, pb: "120px" }}>
        <Typography variant="h3" component="h1" color="text.primary">
          しゃべらないAIチャット
        </Typography>

        {error && (
          <Alert severity="error">{error}</Alert>
        )}

        <MessageList
          messages={messages}
          onTextSelect={handleTextSelect}
          onNotResolved={handleNotResolved}
          disabled={loading}
          highlights={highlights}
          hoveredChildId={hoveredChildId}
          onHoverChild={setHoveredChildId}
        />

        <LoadingIndicator loading={loading} />

        <DetailPopover
          open={open}
          anchorPosition={anchorPosition}
          onClose={handleClosePopover}
          onMoreDetails={handleMoreDetails}
          disabled={loading}
        />
      </Stack>

      <ChatInputForm
        value={value.text}
        onChange={onChange}
        onSubmit={handleSubmit}
        disabled={loading}
      />
    </>
  );
}
