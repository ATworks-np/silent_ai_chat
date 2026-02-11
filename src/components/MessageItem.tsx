"use client";

import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import RoundedButton from "./RoundedButton";
import React, { useMemo, useState } from "react";
import type { UserMessage, HighlightedSelection } from "@/types/messages";
import {Grid, IconButton, Tooltip} from "@mui/material";
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MessageItemProps {
  messageId: string;
  content: string;
  userMessages: UserMessage[];
  onTextSelect: () => void;
  onNotResolved: () => void;
  disabled?: boolean;
  depth?: number;
  children?: React.ReactNode;
  highlights?: HighlightedSelection[];
  isHighlighted?: boolean;
  onHoverChild?: (childId: string) => void;
  suggestedActions?: string[];
  onActionClick?: (action: string) => void;
  isHistoryTarget?: boolean;
  isInHistoryChain?: boolean;
  onToggleHistoryTarget?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MessageItem({
  messageId: _messageId,
  content,
  userMessages,
  onTextSelect,
  onNotResolved,
  disabled = false,
  children,
  highlights = [],
  isHighlighted = false,
  onHoverChild,
  suggestedActions,
  onActionClick,
  isHistoryTarget = false,
   isInHistoryChain = false,
  onToggleHistoryTarget,
}: MessageItemProps) {
  const [nextQuestionsExpanded, setNextQuestionsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Create highlighted content with mark tags
  // コードブロック（``` ```）やインラインコード（`code`）の中は置換しない
  const highlightedContent = useMemo(() => {
    if (highlights.length === 0) return content;

    // Sort by length descending to avoid partial replacements
    const sortedHighlights = [...highlights].sort((a, b) => b.text.length - a.text.length);

    const applyHighlights = (text: string) => {
      let result = text;
      sortedHighlights.forEach((highlight) => {
        if (!highlight.text) return;
        const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escapedText, "g");
        result = result.replace(
          regex,
          `<mark data-child-id="${highlight.childMessageId}">${highlight.text}</mark>`,
        );
      });
      return result;
    };

    // 1. コードブロック（``` ... ```）を保護
    const fencedCodePattern = /(```[\s\S]*?```)/g;
    const fencedSegments = content.split(fencedCodePattern);

    return fencedSegments
      .map((segment) => {
        if (segment.startsWith("```") && segment.endsWith("```")) {
          // コードブロックそのものはそのまま返す
          return segment;
        }

        // 2. インラインコード（`code`）を保護
        const inlineCodePattern = /(`[^`]*`)/g;
        const inlineSegments = segment.split(inlineCodePattern);

        return inlineSegments
          .map((inline) => {
            if (inline.startsWith("`") && inline.endsWith("`")) {
              // インラインコードはそのまま
              return inline;
            }
            // 通常テキスト部分だけハイライト適用
            return applyHighlights(inline);
          })
          .join("");
      })
      .join("");
  }, [content, highlights]);

  return (

      <Stack direction='row' spacing={{ xs: 0.5, sm: 2 }} sx={{ width: '100%' }}>
        <Box
          sx={{
            height: '50px',
            width: {xs: '10px', sm: "20px"},
            borderBottom: 2,
            borderBottomColor: 'divider',
            '&:hover': {
              borderLeftColor: 'primary.main'
            },
          }}
        />
        <Box
          sx={{
            flexGrow: 1,
            color: "text.primary",
            transition: "background-color 0.2s ease",
            backgroundColor:
              isHighlighted || isHistoryTarget || isInHistoryChain
                ? "secondary.light"
                : "",
          }}
        >
          {userMessages.length > 0 && (
              <Accordion
                disableGutters
                elevation={0}
                sx={{
                  justifyContent: "flex-end",
                  backgroundColor: "transparent",
                  "&::before": { display: "none" },
                  flex: 1,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    minHeight: 0,
                    justifyContent: "flex-end",
                    "& .MuiAccordionSummary-content": {
                      margin: 0,
                      flexGrow: 0,
                    },
                    "& .MuiAccordionSummary-expandIconWrapper": {
                      marginLeft: "4px", // 任意の余白
                    },
                    padding: 0,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    送信したメッセージを見る
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 1, pb: 0 }}>
                  <Stack spacing={1}>
                    {userMessages.map((msg) => (
                      <Typography
                        key={msg.id}
                        variant="caption"
                        color="text.secondary"
                        sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                      >
                        {msg.content}
                      </Typography>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            )}
          <Box
            sx={{
              userSelect: "text",
              cursor: "text",
              maxWidth: "100%",
              overflowX: "auto",
              "& p": { margin: "0.5em 0" },
              // テーブル用のスタイルを追加
              "& table": {
                width: "100%",
                borderCollapse: "collapse",
                margin: "1em 0",
                overflowX: "auto",
                display: "block",
              },
              "& th, & td": {
                border: "1px solid rgba(0, 0, 0, 0.12)",
                padding: "8px 12px",
                textAlign: "left",
              },
              "& th": {
                backgroundColor: "rgba(0, 0, 0, 0.02)",
                fontWeight: "bold",
              },
              "& ul, & ol": { paddingLeft: "2em", margin: "0.5em 0" },
              "& code": {
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                padding: "0.2em 0.4em",
                borderRadius: "3px",
                fontFamily: "monospace"
              },

              "& pre": {
                backgroundColor: "rgba(0, 0, 0, 0.05)",
                padding: "1em",
                borderRadius: "4px",
                overflowX: "auto",
                display: "block",
                maxWidth: "100%",
                boxSizing: "border-box",
                WebkitOverflowScrolling: "touch",
              },

              "& pre code": {
                backgroundColor: "transparent",
                padding: 0,
                whiteSpace: "pre",
              },
              "& mark": {
                backgroundColor: "secondary.main",
                color: "secondary.contrastText",
                borderRadius: "2px",
                padding: "0.1em 0.2em",
                cursor: "pointer",
              },
              "& .katex-display": {
                margin: "1em 0",
                overflowX: "auto",
                overflowY: "hidden",
              },
            }}
            onMouseUp={onTextSelect}
          >
            <ReactMarkdown
              // remarkGfmをプラグインに追加
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
              components={{
                mark: ({ node, children, ...props }) => {
                  const dataChildIdFromProps = (props as { [key: string]: unknown })["data-child-id"];
                  const dataChildIdFromNode =
                    node && "properties" in (node as never)
                      ? (node as { properties?: { [key: string]: unknown } }).properties?.["data-child-id"]
                      : "";

                  const dataChildId =
                    (typeof dataChildIdFromProps === "string" && dataChildIdFromProps) ||
                    (typeof dataChildIdFromNode === "string" && dataChildIdFromNode) ||
                    "";

                  const handleMouseEnter = () => {
                    if (dataChildId && onHoverChild) onHoverChild(dataChildId);
                  };

                  const handleMouseLeave = () => {
                    if (onHoverChild) onHoverChild("");
                  };

                  return (
                    <mark
                      {...props}
                      data-child-id={dataChildId}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {children}
                    </mark>
                  );
                },
                pre: ({ node, children, ...props }) => {
                  const handleCopy = () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const extractText = (obj: any): string => {
                      if (!obj) return "";
                      if (typeof obj === "string") return obj;
                      if (obj.type === "text") return obj.value || "";
                      if (obj.children && Array.isArray(obj.children)) {
                        return obj.children.map(extractText).join("");
                      }
                      if (obj.props && obj.props.children) {
                        return React.Children.toArray(obj.props.children).map(extractText).join("");
                      }
                      return "";
                    };

                    const codeText = extractText(node);
                    if (codeText) {
                      navigator.clipboard.writeText(codeText)
                        .then(() => {
                          setCopySuccess("コピーしました");
                          setTimeout(() => setCopySuccess(null), 2000);
                        })
                        .catch(() => {
                          setCopySuccess("コピーに失敗しました");
                          setTimeout(() => setCopySuccess(null), 2000);
                        });
                    }
                  };

                  return (
                    <Box
                      sx={{
                        position: "relative",
                        // preの背景色と合わせることで、ボタン周りの余白を自然にします
                        backgroundColor: "rgba(0, 0, 0, 0.05)",
                        borderRadius: "4px",
                        margin: "1em 0",
                        overflow: "auto",
                        "&::-webkit-scrollbar": { height: "8px" },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: "rgba(0,0,0,0.2)",
                          borderRadius: "4px",
                        },
                      }}
                    >
                      {/* pre 自体にスクロールを設定 */}
                      <Box
                        component="pre"
                        {...props}
                        sx={{
                          margin: 0, // 外側のBoxで制御するので0に
                          padding: "1em",
                          overflowX: "auto", // 横スクロールを有効化
                          display: "block",
                          width: "100%",
                          boxSizing: "border-box",
                          // スクロールバーの見た目を少し整える（任意）
                          // "&::-webkit-scrollbar": { height: "8px" },
                          // "&::-webkit-scrollbar-thumb": {
                          //   backgroundColor: "rgba(0,0,0,0.2)",
                          //   borderRadius: "4px",
                          // },
                        }}
                      >
                        {children}
                      </Box>

                      <Tooltip title={copySuccess || "クリップボードにコピー"} placement="top">
                        <IconButton
                          size="small"
                          onClick={handleCopy}
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            backgroundColor: "rgba(255, 255, 255, 0.8)", // スクロールで見え隠れしないよう不透明度を調整
                            '&:hover': { backgroundColor: "rgba(255, 255, 255, 0.9)" },
                            zIndex: 1, // コードより上に表示
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                },
                table: ({ children }) => (
                  <Box component="table">
                    {children}
                  </Box>
                ),
              }}
            >
              {highlightedContent}
            </ReactMarkdown>
          </Box>

            <Accordion
              disableGutters
              elevation={0}
              expanded={nextQuestionsExpanded}
              onChange={(_, isExpanded) => setNextQuestionsExpanded(isExpanded)}
              sx={{
                mt: 1,
                width: "100%", // 親の幅いっぱいに広げる
                backgroundColor: "transparent",
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                sx={{
                  minHeight: 0,
                  px: 0,
                  justifyContent: "flex-end",
                  "& .MuiAccordionSummary-content": {
                    margin: 0,
                    flexGrow: 0, // 幅をコンテンツ分のみにする
                  },
                  "& .MuiAccordionSummary-expandIconWrapper": {
                    marginLeft: "4px", // テキストとアイコンの隙間を調整
                  },
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  次の質問をみる
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 1, pb: 0 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid size={{ xs: 12, md: 10 }}>
                    <Stack direction='row' spacing={2}>
                      {suggestedActions && suggestedActions.slice(0, 2).map((action: string) => (
                        <RoundedButton
                          key={action}
                          variant="outlined"
                          color="secondary"
                          onClick={() => {
                            if (disabled || !onActionClick) return;
                            onActionClick(action);
                            setNextQuestionsExpanded(false);
                          }}
                          disabled={disabled}
                        >
                          {action}
                        </RoundedButton>

                      ))}
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <RoundedButton
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        onNotResolved();
                        setNextQuestionsExpanded(false);
                      }}
                      disabled={disabled}
                    >
                      未解決
                    </RoundedButton>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            <Box sx={{ textAlign: "right", width: "100%"}}>
              <Tooltip title={"チャット履歴に含める"} placement="top">
                <IconButton
                  color={isHistoryTarget ? "secondary" : "default"}
                  size="small"
                  onClick={() => !disabled && onToggleHistoryTarget?.()}
                  disabled={disabled}
                >
                  <PlaylistAddCheckIcon />
                </IconButton>
              </Tooltip>
            </Box>


          {children && (
            <Box sx={{ mt: 2 }}>
              {children}
            </Box>
          )}
        </Box>
      </Stack>
  );
}
