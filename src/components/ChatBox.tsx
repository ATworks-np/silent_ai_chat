"use client";

import { useState, useCallback } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { useChatInput } from "@/hooks/useChatInput";
import { useGemini } from "@/hooks/useGemini";
import { useChatSettings } from "@/hooks/useChatSettings";
import ChatInputForm from "./ChatInputForm";
import MessageList from "./MessageList";
import DetailPopover from "./DetailPopover";
import NextActionsModal from "./NextActionsModal";
import type { HighlightedSelection } from "@/types/messages";
import {Grid} from "@mui/material";

export default function ChatBox() {
  const { value, onChange, reset } = useChatInput();
  const { quality, tone, sendMethod, setQuality, setTone, setSendMethod } = useChatSettings();
  const { messages, loading, error, sendMessage } = useGemini({ quality, tone });
  const [anchorPosition, setAnchorPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [highlights, setHighlights] = useState<HighlightedSelection[]>([]);
  const [hoveredChildId, setHoveredChildId] = useState<string>("");
  const [activeSuggestions, setActiveSuggestions] = useState<{
    messageId: string;
    content: string;
    actions: string[];
  } | null>(null);
  const [historyTargetMessageId, setHistoryTargetMessageId] = useState<string | null>(null);

  const handleTextSelect = useCallback((messageId: string) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    // 選択が外れた（空文字になった）場合はポップオーバーを閉じる
    if (!text || text.length === 0 || !selection || selection.rangeCount === 0) {
      setAnchorPosition(null);
      setSelectedText("");
      setSelectedMessageId("");
      return;
    }

    if (selection && selection.rangeCount > 0) {
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

  const handleSuggestedActionClick = useCallback(async (messageId: string, action: string) => {
    if (!action.trim() || loading) return;

    await sendMessage(action, messageId);
  }, [loading, sendMessage]);

  const handleSubmit = async () => {
    if (!value.text.trim() || loading) return;

    reset();
    // 履歴ターゲットが選択されている場合は、そのメッセージの履歴を含めて送信
    if (historyTargetMessageId) {
      await sendMessage(value.text, historyTargetMessageId);
    } else {
      await sendMessage(value.text);
    }

  };

  return (
    <Box
      sx={{ minHeight: "100vh" }}
      onClick={() => {
        // 背景クリックで次の質問パネルを閉じる
        setActiveSuggestions(null);
      }}
    >
      <Stack
        alignItems="center"
        spacing={2}
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          pb: "120px",
        }}
        onClick={(event) => {
          // コンテンツ内のクリックは背景クリック扱いにしない
          event.stopPropagation();
        }}
      >
        <Grid container spacing={0} sx={{width: '100%'}}>
          <Grid size={{xs: 12, md:6}} >
            <Typography sx={{ textAlign: { xs: 'left', md: 'right' } }}　variant="h5" component="h1" color="text.primary" fontWeight="bold">
              しゃべらない
            </Typography>
          </Grid>
          <Grid size={{xs: 12, md:6}}>
            <Typography variant="h5" component="h1" color="text.primary" fontWeight="bold">
              AIチャット
            </Typography>
          </Grid>
        </Grid>


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
          onActionClick={handleSuggestedActionClick}
          onShowSuggestions={(messageId, content, actions) => {
            if (!actions || actions.length === 0) {
              // 提案アクションを持たないPaperや別の領域をクリックした場合はパネルを閉じる
              setActiveSuggestions(null);
              return;
            }

            setActiveSuggestions({ messageId, content, actions });
          }}
          historyTargetMessageId={historyTargetMessageId}
          onHistoryTargetChange={(messageId) => {
            setHistoryTargetMessageId(messageId);
          }}
          loading={loading}
        />

        <DetailPopover
          open={open}
          anchorPosition={anchorPosition}
          onClose={handleClosePopover}
          onMoreDetails={handleMoreDetails}
          disabled={loading}
        />
      </Stack>

      <NextActionsModal
        open={Boolean(activeSuggestions)}
        actions={activeSuggestions?.actions ?? []}
        loading={loading}
        onActionClick={(action) => {
          if (!activeSuggestions) return;
          void handleSuggestedActionClick(activeSuggestions.messageId, action);
        }}
        onNotResolved={() => {
          if (!activeSuggestions) return;
          void handleNotResolved(activeSuggestions.messageId, activeSuggestions.content);
        }}
        onClose={() => {
          setActiveSuggestions(null);
        }}
      />

      <ChatInputForm
        value={value.text}
        onChange={onChange}
        onSubmit={handleSubmit}
        disabled={loading}
        quality={quality}
        tone={tone}
        setQuality={setQuality}
        setTone={setTone}
        sendMethod={sendMethod}
        setSendMethod={setSendMethod}
        // 入力欄クリックも背景扱いにならないようにする
        // ラッパーの Box で onClick stopPropagation 済みのためここは不要
      />
    </Box>
  );
}
