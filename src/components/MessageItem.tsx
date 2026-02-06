"use client";

import Paper from "@mui/material/Paper";
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
import { useMemo } from "react";
import type { UserMessage, HighlightedSelection } from "@/types/messages";
import { Grid } from "@mui/material";

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
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function MessageItem({
  messageId: _messageId,
  content,
  userMessages,
  onTextSelect,
  onNotResolved,
  disabled = false,
  depth = 0,
  children,
  highlights = [],
  isHighlighted = false,
  onHoverChild,
  suggestedActions,
  onActionClick,
}: MessageItemProps) {
  
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
    <Box sx={{ pl: depth * 2 }}>
      <Paper
        sx={{
          p: 2,
          color: "text.primary",
          borderLeftColor: depth > 0 ? "secondary.main" : undefined,
          transition: "background-color 0.2s ease",
          backgroundColor: isHighlighted ? "secondary.light" : "background.paper",

        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          {userMessages.length > 0 && (
            <Accordion
              disableGutters
              elevation={0}
              sx={{
                backgroundColor: "transparent",
                "&::before": { display: "none" },
                flex: 1,
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                sx={{
                  minHeight: 0,
                  justifyContent: "flex-start",
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
        </Stack>
        <Box
          sx={{
            userSelect: "text",
            cursor: "text",
            "& p": { margin: "0.5em 0" },
            "& h1, & h2, & h3, & h4, & h5, & h6": {
              marginTop: "1em",
              marginBottom: "0.5em",
              fontWeight: "bold"
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
              overflow: "auto"
            },
            "& pre code": {
              backgroundColor: "transparent",
              padding: 0
            },
            "& mark": {
              backgroundColor: "secondary.main",
              color: "secondary.contrastText",
              borderRadius: "2px",
              padding: "0.1em 0.2em",
              cursor: "pointer",
            }
          }}
          onMouseUp={onTextSelect}
        >
          <ReactMarkdown
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            // markタグにホバーイベントを付与して対応する子メッセージのPaperをハイライト
            components={{
              mark: ({ node, children, ...props }) => {
                // data-child-id は props 側に乗ってくる場合があるので、まず props を優先して読む
                const dataChildIdFromProps =
                  (props as { [key: string]: unknown })["data-child-id"];

                const dataChildIdFromNode =
                  node && "properties" in (node as never)
                    ? (node as { properties?: { [key: string]: unknown } }).properties?.["data-child-id"]
                    : "";

                const dataChildId =
                  (typeof dataChildIdFromProps === "string" && dataChildIdFromProps) ||
                  (typeof dataChildIdFromNode === "string" && dataChildIdFromNode) ||
                  "";

                const handleMouseEnter = () => {
                  if (dataChildId) {
                    console.log("Hovered highlight for child message:", dataChildId);
                    if (onHoverChild) {
                      onHoverChild(dataChildId);
                    }
                  }
                };

                const handleMouseLeave = () => {
                  if (onHoverChild) {
                    onHoverChild("");
                  }
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
            }}
          >
            {highlightedContent}
          </ReactMarkdown>
        </Box>
        <Grid container spacing={1} alignItems="center">
          {suggestedActions && suggestedActions.slice(0, 2).map((action: string) => (
            <Grid key={action} size={{ xs: 12, lg: 5}}>
              <RoundedButton
                variant="outlined"
                color="secondary"
                onClick={() => {
                  if (disabled || !onActionClick) return;
                  onActionClick(action);
                }}
                disabled={disabled}
              >
                {action}
              </RoundedButton>
            </Grid>
          ))}
          <Grid size={{ xs: 12, lg: 2 }}>
            <RoundedButton
              variant="outlined"
              color="secondary"
              onClick={onNotResolved}
              disabled={disabled}
            >
              未解決
            </RoundedButton>
          </Grid>
        </Grid>
        {children && (
          <Box sx={{ mt: 2 }}>
            {children}
          </Box>
        )}
      </Paper>
    </Box>

  );
}
