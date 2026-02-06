"use client";

import Stack from "@mui/material/Stack";
import { GeminiMessage } from "../hooks/useGemini";
import MessageItem from "./MessageItem";
import type { HighlightedSelection, UserMessage } from "@/types/messages";
import { Box } from "@mui/material";

interface MessageListProps {
  messages: GeminiMessage[];
  onTextSelect: (messageId: string) => void;
  onNotResolved: (messageId: string, content: string) => void;
  disabled?: boolean;
  highlights: HighlightedSelection[];
  hoveredChildId: string;
  onHoverChild: (childId: string) => void;
  onActionClick: (messageId: string, action: string) => void;
}

export default function MessageList({ messages, onTextSelect, onNotResolved, disabled = false, highlights, hoveredChildId, onHoverChild, onActionClick }: MessageListProps) {
  const assistantMessages = messages.filter(msg => msg.role === "assistant");

  if (assistantMessages.length === 0) {
    return null;
  }

  // Build tree structure (論理的な親子関係は維持しつつ、DOM はフラットに描画する)
  const rootMessages = assistantMessages.filter(msg => !msg.parentId);
  
  const getChildren = (parentId: string): GeminiMessage[] => {
    return assistantMessages.filter(msg => msg.parentId === parentId);
  };

  // フラットな一覧（depth 情報付き）に変換
  const flattened: { msg: GeminiMessage; depth: number }[] = [];

  const walk = (msg: GeminiMessage, depth: number) => {
    flattened.push({ msg, depth });
    const children = getChildren(msg.id);
    children.forEach(child => walk(child, depth + 1));
  };

  rootMessages.forEach(root => walk(root, 0));

  return (
    <Box sx={{maxWidth: "800px"}}>
      <Stack spacing={2} sx={{ mt: 3,  mx: "auto" }}>
        {flattened.map(({ msg, depth }) => {
          // Find highlights for this message
          const messageHighlights = highlights.filter(h => h.messageId === msg.id);

          // Check if this message should be highlighted (when hovering over corresponding mark)
          const isHighlighted = msg.id === hoveredChildId;

          // Find the userメッセージ that directly led to this AI回答
          const assistantIndex = messages.findIndex((m) => m.id === msg.id);
          const relatedUserMessages = messages.filter((m, index) => (
            index < assistantIndex &&
            m.role === "user" &&
            m.parentId === msg.parentId
          ));

          // 直近のものだけを「もとになったメッセージ」として採用
          const sourceUserMessages: UserMessage[] =
            relatedUserMessages.length > 0
              ? [{ id: relatedUserMessages[relatedUserMessages.length - 1].id, content: relatedUserMessages[relatedUserMessages.length - 1].content }]
              : [];

          return (
            <MessageItem
              key={msg.id}
              messageId={msg.id}
              content={msg.content}
              userMessages={sourceUserMessages}
              onTextSelect={() => onTextSelect(msg.id)}
              onNotResolved={() => onNotResolved(msg.id, msg.content)}
              disabled={disabled}
              depth={depth}
              highlights={messageHighlights}
              isHighlighted={isHighlighted}
              onHoverChild={onHoverChild}
              suggestedActions={msg.suggestedActions}
              onActionClick={onActionClick ? (action: string) => onActionClick(msg.id, action) : undefined}
            />
          );
        })}
      </Stack>
    </Box>

  );
}
