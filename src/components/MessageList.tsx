"use client";

import Stack from "@mui/material/Stack";
import { GeminiMessage } from "../hooks/useGemini";
import MessageItem from "./MessageItem";
import type { HighlightedSelection, UserMessage } from "@/types/messages";
import { Box } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import DoDisturbOnOutlinedIcon from '@mui/icons-material/DoDisturbOnOutlined';

interface MessageListProps {
  messages: GeminiMessage[];
  onTextSelect: (messageId: string) => void;
  onNotResolved: (messageId: string, content: string) => void;
  disabled?: boolean;
  highlights: HighlightedSelection[];
  hoveredChildId: string;
  onHoverChild: (childId: string) => void;
  onActionClick: (messageId: string, action: string) => void;
  onShowSuggestions?: (messageId: string, content: string, actions: string[]) => void;
  historyTargetMessageId?: string | null;
  onHistoryTargetChange?: (messageId: string | null) => void;
}

export default function MessageList({ messages, onTextSelect, onNotResolved, disabled = false, highlights, hoveredChildId, onHoverChild, onActionClick, onShowSuggestions, historyTargetMessageId, onHistoryTargetChange }: MessageListProps) {
  const assistantMessages = messages.filter(msg => msg.role === "assistant");

  if (assistantMessages.length === 0) {
    return null;
  }

  // 履歴ターゲットに選ばれている回答と、その親以上（祖先）にあたる回答IDの集合を作る
  const historyChainIds = new Set<string>();

  if (historyTargetMessageId) {
    let currentId: string | undefined | null = historyTargetMessageId;

    while (currentId) {
      const current = assistantMessages.find((m) => m.id === currentId);
      if (!current) break;

      historyChainIds.add(current.id);

      if (!current.parentId) break;

      const parentAssistant = assistantMessages.find((m) => m.id === current.parentId);
      if (!parentAssistant) break;

      currentId = parentAssistant.id;
    }
  }

  // Build tree structure (親子関係を維持し、DOMもネストして描画する)
  const rootMessages = assistantMessages.filter(msg => !msg.parentId);

  const getChildren = (parentId: string): GeminiMessage[] => {
    return assistantMessages.filter(msg => msg.parentId === parentId);
  };

  // 再帰的にメッセージとその子メッセージをレンダリングする関数
  const renderMessageTree = (msg: GeminiMessage, depth: number) => {
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

    const suggestedActions = msg.suggestedActions ?? [];
    const isHistoryTarget = historyTargetMessageId === msg.id;
    const isInHistoryChain = historyChainIds.has(msg.id);

    // Get children of this message
    const children = getChildren(msg.id);

    return (
      <Box 
        key={msg.id} 
        sx={{
          mb: 2,
          overflow: 'hidden'
        }}
      >
        <MessageItem
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
          suggestedActions={suggestedActions}
          onActionClick={onActionClick ? (action: string) => onActionClick(msg.id, action) : undefined}
          isHistoryTarget={isHistoryTarget}
          isInHistoryChain={isInHistoryChain}
          onToggleHistoryTarget={onHistoryTargetChange ? () => onHistoryTargetChange(isHistoryTarget ? null : msg.id) : undefined}
        />

        {children.length > 0 && (
          <Box sx={{ pb: 2 }}>
            <Stack direction='row' sx={{pl: 2}}>
              <Stack alignItems='flex-end' direction='column' >
                <IconButton sx={{ p: 0, fontSize: { xs: '1rem', md: '1rem'} }}>
                  <DoDisturbOnOutlinedIcon color='secondary' fontSize="inherit"/>
                </IconButton>
                <Box
                  sx={{
                    height: '100%',
                    borderLeft: 2,
                    borderLeftColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': {
                      borderLeftColor: 'primary.main'
                    },
                  }}
                />
              </Stack>

              <Stack>
                {children.map(child => renderMessageTree(child, depth + 1))}
              </Stack>

            </Stack>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{maxWidth: "800px"}}>
      <Stack spacing={2} sx={{ mt: 3, mx: "auto" }}>
        {rootMessages.map(msg => renderMessageTree(msg, 0))}
      </Stack>
    </Box>
  );
}
