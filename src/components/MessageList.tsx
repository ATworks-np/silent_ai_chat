"use client";

import Stack from "@mui/material/Stack";
import { GeminiMessage } from "../hooks/useGemini";
import MessageItem from "./MessageItem";

interface HighlightedSelection {
  messageId: string;
  text: string;
  childMessageId: string;
}

interface UserMessage {
  id: string;
  content: string;
}

interface MessageListProps {
  messages: GeminiMessage[];
  onTextSelect: (messageId: string) => void;
  onNotResolved: (messageId: string, content: string) => void;
  disabled?: boolean;
  highlights: HighlightedSelection[];
  hoveredChildId: string;
  onHoverChild: (childId: string) => void;
}

export default function MessageList({ messages, onTextSelect, onNotResolved, disabled = false, highlights, hoveredChildId, onHoverChild }: MessageListProps) {
  const assistantMessages = messages.filter(msg => msg.role === "assistant");

  if (assistantMessages.length === 0) {
    return null;
  }

  // Build tree structure
  const rootMessages = assistantMessages.filter(msg => !msg.parentId);
  
  const getChildren = (parentId: string): GeminiMessage[] => {
    return assistantMessages.filter(msg => msg.parentId === parentId);
  };

  const renderMessage = (msg: GeminiMessage, depth: number = 0): React.ReactNode => {
    const children = getChildren(msg.id);
    
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
      >
        {children.length > 0 && (
          <Stack spacing={2}>
            {children.map(child => renderMessage(child, depth + 1))}
          </Stack>
        )}
      </MessageItem>
    );
  };

  return (
    <Stack spacing={2} sx={{ mt: 3, maxWidth: "800px", mx: "auto" }}>
      {rootMessages.map(msg => renderMessage(msg))}
    </Stack>
  );
}
