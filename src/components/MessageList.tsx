"use client";

import { useState, useEffect, useRef } from "react";
import Stack from "@mui/material/Stack";
import { GeminiMessage } from "@/hooks/useGemini";
import MessageItem from "./MessageItem";
import type { HighlightedSelection } from "@/types/messages";
import {Box, Collapse, Divider} from "@mui/material";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import LoadingModal from "./LoadingModal";
import IconButton from "@mui/material/IconButton";
import DoDisturbOnOutlinedIcon from '@mui/icons-material/DoDisturbOnOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { updateMessageArchive, deleteMessageTree } from '@/services/gemini';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import useUser from '@/hooks/useUser';
import {useAtom} from "jotai";
import {scrollTargetIdAtom} from "@/stores/scrollToMessage";

interface MessageListProps {
  messages: GeminiMessage[];
  onTextSelect: (messageId: string) => void;
  onNotResolved: (messageId: string, content: string) => void;
  disabled?: boolean;
  highlights: HighlightedSelection[];
  hoveredChildId: string;
  onHoverChild: (childId: string) => void;
  onActionClick: (messageId: string, action: string) => void;
  historyTargetMessageId?: string | null;
  onHistoryTargetChange?: (messageId: string | null) => void;
  onDeleteMessageTree?: (rootMessageId: string) => void;
}

export default function MessageList({ messages, onTextSelect, onNotResolved, disabled = false, highlights, hoveredChildId, onHoverChild, onActionClick, historyTargetMessageId, onHistoryTargetChange, onDeleteMessageTree }: MessageListProps) {
  const { user } = useUser();
  const [archiveIds, setArchiveIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [initializedArchive, setInitializedArchive] = useState(false);
  const userMessages = messages.filter(msg => msg.role === "user");
  const assistantMessages = messages.filter(msg => msg.role === "assistant");

  const [scrollTargetId, setScrollTargetId] = useAtom(scrollTargetIdAtom);

  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollToMessage = (messageId: string) => {
    const element = itemRefs.current.get(messageId);
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset - 100;
      const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);

      window.scrollTo({
        top: middle,
        behavior: 'smooth'
      });
    }
  };

  // Effect to initialize archive status from messages
  useEffect(() => {
    if (userMessages.length > 0 && !initializedArchive) {
      const initialArchiveIds = new Set<string>();
      userMessages.forEach(msg => {
        if (msg.archive) {
          initialArchiveIds.add(msg.id);
        }
      });
      setArchiveIds(initialArchiveIds);
      setInitializedArchive(true);
    }
  }, [userMessages, initializedArchive]);
  // State to track which messages are collapsed
  const [collapsedMessageIds, setCollapsedMessageIds] = useState<Set<string>>(new Set());
  // Ref to track the latest message
  const latestMessageRef = useRef<HTMLDivElement>(null);
  // Ref to track the previous messages length
  const prevMessagesLengthRef = useRef<number>(0);

  // Compute the latest message ID (based on user messages)
  const latestMessageId = userMessages.length > 0 
    ? userMessages[userMessages.length - 1].id 
    : null;

  // Effect to scroll to the latest message when a new message is added
  useEffect(() => {
    if (userMessages.length > prevMessagesLengthRef.current) {
      prevMessagesLengthRef.current = userMessages.length;

      // 最新のIDを特定
      const lastId = userMessages[userMessages.length - 1]?.id;

      if (lastId) {
        // DOMの更新を待ってから、Mapから最新要素を引いてスクロール
        setTimeout(() => {
          scrollToMessage(lastId);
        }, 100);
      }
    }
    if (scrollTargetId) {
      setTimeout(() => {
        scrollToMessage(scrollTargetId);
        setScrollTargetId(null);
      }, 100);
    }
  }, [userMessages.length, scrollTargetId, setScrollTargetId]);


  // Function to toggle collapsed state of a message
  const toggleCollapsed = (messageId: string) => {
    setCollapsedMessageIds(prevState => {
      const newState = new Set(prevState);
      if (newState.has(messageId)) {
        newState.delete(messageId);
      } else {
        newState.add(messageId);
      }
      return newState;
    });
  };

  if (userMessages.length === 0) {
    return null;
  }

  // 履歴ターゲットに選ばれている回答と、その親以上（祖先）にあたる回答IDの集合を作る
  const historyChainIds = new Set<string>();

  if (historyTargetMessageId) {
    let currentId: string | undefined | null = historyTargetMessageId;

    while (currentId) {
      const currentAssistant = assistantMessages.find((m) => m.id === currentId);
      if (!currentAssistant) break;

      historyChainIds.add(currentAssistant.id);

      if (!currentAssistant.parentId) break;

      const nextAssistant = assistantMessages.find((m) => m.id === currentAssistant.parentId);
      if (!nextAssistant) break;

      currentId = nextAssistant.id;
    }
  }

  // Build tree structure (親子関係を維持し、DOMもネストして描画する)
  // ユーザーメッセージを基準にするため、parentId がない user メッセージをルートとする
  const rootUserMessages = userMessages.filter(msg => !msg.parentId);

  // 指定したアシスタントメッセージに対する次の問いかけ（userメッセージ）を取得する
  const getUserChildren = (assistantId: string): GeminiMessage[] => {
    return userMessages.filter(msg => msg.parentId === assistantId);
  };

  // 指定したユーザーメッセージに対する回答（assistantメッセージ）を取得する
  const getAssistantResponse = (userId: string): GeminiMessage | undefined => {
    return assistantMessages.find(msg => msg.sourceUserMessageId === userId);
  };

  // 再帰的にユーザーメッセージとその回答、および続く問いかけをレンダリングする関数
  const renderMessageTree = (userMsg: GeminiMessage, depth: number) => {
    const assistantMsg = getAssistantResponse(userMsg.id);
    
    // 回答がない場合は（生成中などの可能性も含め）ユーザーメッセージのみ、
    // あるいは何も表示しない選択肢があるが、ここでは回答があることを前提とした MessageItem 構造を維持する
    if (!assistantMsg) {
      // 回答がまだない場合でもユーザーメッセージを表示したい場合はここで調整が必要
      // 現状の MessageItem は assistantMsg 基準なので、空の assistantMsg を想定するか、
      // ユーザーメッセージ単体での表示をサポートする必要がある。
      // ここでは、assistantMsg が見つかるまで待つか、ダミーで表示する。
      return null;
    }

    // Find highlights for this assistant message
    const messageHighlights = highlights.filter(h => h.messageId === assistantMsg.id);

    // Check if this assistant message should be highlighted
    const isHighlighted = assistantMsg.id === hoveredChildId;
    
    // MessageItem に渡すユーザーメッセージ（問いかけ）のリスト
    const sourceUserMessages = [userMsg];

    const suggestedActions = assistantMsg.suggestedActions ?? [];
    const isHistoryTarget = historyTargetMessageId === assistantMsg.id;
    const isInHistoryChain = historyChainIds.has(assistantMsg.id);

    // 次の問いかけ（子ユーザーメッセージ）を取得
    const children = getUserChildren(assistantMsg.id);

    const isLatest = userMsg.id === latestMessageId;

    return (
      <Box 
        key={userMsg.id}
        ref={(el: HTMLDivElement) => {
          if (el) itemRefs.current.set(userMsg.id, el);
          else itemRefs.current.delete(userMsg.id);
        }}
        sx={{
          ml: 0,
          mb: 2,
          overflow: 'hidden',
          flexGlow: 1,
          width: '100%',
        }}
      >
        <MessageItem
          messageId={assistantMsg.id}
          content={assistantMsg.content}
          userMessages={sourceUserMessages}
          onTextSelect={() => onTextSelect(assistantMsg.id)}
          onNotResolved={() => onNotResolved(assistantMsg.id, assistantMsg.content)}
          disabled={disabled}
          depth={depth}
          highlights={messageHighlights}
          isHighlighted={isHighlighted}
          onHoverChild={onHoverChild}
          suggestedActions={suggestedActions}
          onActionClick={onActionClick ? (action: string) => onActionClick(assistantMsg.id, action) : undefined}
          isHistoryTarget={isHistoryTarget}
          isInHistoryChain={isInHistoryChain}
          onToggleHistoryTarget={onHistoryTargetChange ? () => onHistoryTargetChange(isHistoryTarget ? null : assistantMsg.id) : undefined}
        />

        {children.length > 0 && (
          <Stack direction='row' sx={{pl: {xs: 0, sm: 3}}}>
            <Stack alignItems='flex-end' direction='column' >
              <IconButton
                sx={{ p: 0, fontSize: { xs: '1rem', md: '1rem'} }}
                onClick={() => toggleCollapsed(userMsg.id)}
              >
                {collapsedMessageIds.has(userMsg.id) ? (
                  <AddCircleOutlineOutlinedIcon color='secondary' fontSize="inherit"/>
                ) : (
                  <DoDisturbOnOutlinedIcon color='secondary' fontSize="inherit"/>
                )}
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

            <Collapse in={!collapsedMessageIds.has(userMsg.id)} timeout={300} sx={{ width: '100%', flexGlow: 1}}>
              <Stack>
                {children.map(child => renderMessageTree(child, depth + 1))}
              </Stack>
            </Collapse>

          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{maxWidth: "800px", width: "100%"}}>
      <Stack spacing={2} sx={{ mt: 3, mx: "auto" }}>
        {rootUserMessages.map(userMsg => {
          const assistantMsg = getAssistantResponse(userMsg.id);
          const rootId = assistantMsg ? assistantMsg.id : userMsg.id;

          return (
            <Stack key={userMsg.id}>
              {renderMessageTree(userMsg, 0)}
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 1 }}>
                <IconButton
                  size="small"
                  onClick={async () => {
                    if (!user.props.uid) return;
                    const targetId = userMsg.id;
                    const newArchive = !archiveIds.has(targetId);
                    try {
                      await updateMessageArchive(user.props.uid, targetId, newArchive);
                      setArchiveIds((prev) => {
                        const next = new Set(prev);
                        if (newArchive) {
                          next.add(targetId);
                        } else {
                          next.delete(targetId);
                        }
                        return next;
                      });
                    } catch (e) {
                      console.error('Failed to update archive:', e);
                    }
                  }}
                >
                  <BookmarkIcon color={archiveIds.has(userMsg.id) ? "primary" : "secondary"} fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setDeleteTargetId(rootId);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <DeleteForeverIcon color="error" fontSize="small" />
                </IconButton>
              </Stack>
              <Divider />
            </Stack>
          )
        })}
      </Stack>

      <LoadingModal open={deleting} message="削除中..." />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          if (!user.props.uid || !deleteTargetId) return;
          setDeleteDialogOpen(false);
          setDeleting(true);
          try {
            await deleteMessageTree(user.props.uid, deleteTargetId);
            if (onDeleteMessageTree) {
              onDeleteMessageTree(deleteTargetId);
            }
          } catch (e) {
            console.error('Failed to delete message tree:', e);
          } finally {
            setDeleting(false);
            setDeleteTargetId(null);
          }
        }}
      />
    </Box>
  );
}
