"use client";

import React from "react";
import { Box, Grid, Stack, useMediaQuery, useTheme } from "@mui/material";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import TuneIcon from "@mui/icons-material/Tune";
import CircularProgress from "@mui/material/CircularProgress";
import { useSettingsModal } from "@/hooks/useSettingsModal";
import { SettingsModal } from "@/components/SettingsModal";
import type { AnswerQuality, AnswerTone, ChatSendMethod } from "@/hooks/useChatSettings";

interface ChatInputFormProps {
  value: string;
  onChange: (value: string) => void;
  // フォーム側で preventDefault 済みのため、コールバックにはイベントを渡さない
  onSubmit: () => Promise<void> | void;
  disabled?: boolean;
  quality: AnswerQuality;
  tone: AnswerTone;
  setQuality: (quality: AnswerQuality) => void;
  setTone: (tone: AnswerTone) => void;
  sendMethod: ChatSendMethod;
  setSendMethod: (method: ChatSendMethod) => void;
}

export default function ChatInputForm({
  value,
  onChange,
  onSubmit,
  disabled = false,
  quality,
  tone,
  setQuality,
  setTone,
  sendMethod,
  setSendMethod,
}: ChatInputFormProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { state, openModal, closeModal } = useSettingsModal();

  // モバイルデバイスでは常にCtrl+Enterモードを強制（実質Enterキー無効化）
  React.useEffect(() => {
    if (isMobile && sendMethod === "enter") {
      setSendMethod("ctrlEnter");
    }
  }, [isMobile, sendMethod, setSendMethod]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (event.key !== "Enter") return;

    // IME変換中は送信しない
    if (event.nativeEvent.isComposing) return;

    // モバイルデバイスではEnterキーでの送信を無効化
    if (isMobile) return;

    if (sendMethod === "enter") {
      // Shift+Enter は改行として扱い、Enter単体で送信
      if (event.shiftKey) return;

      event.preventDefault();
      void onSubmit();
    } else if (sendMethod === "ctrlEnter") {
      if (!event.ctrlKey) return;

      event.preventDefault();
      void onSubmit();
    }
  };

  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "background.default",
        p: { xs: 1, sm: 3},
        pb: { xs: "calc(env(safe-area-inset-bottom) + 8px)", sm: 3 }, // セーフエリア対応
        zIndex: 1000,
        width: "100%",
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <Stack spacing={1} sx={{ maxWidth: "800px", mx: "auto" }}>
          <Grid container  spacing={{ xs: 0, md: 2 }} alignItems="center">
            <Grid size={{ xs: 1 }}>
              <IconButton
                color="default"
                aria-label="設定"
                size="large"
                onClick={openModal}
                sx={{ fontSize: { xs: '1.7rem', md: '2rem'} }}
              >
                <TuneIcon />
              </IconButton>
            </Grid>
            <Grid size={{ xs: 10}}>
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={10}
                variant="outlined"
                color="primary"
                placeholder="メッセージを入力"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 5,
                    backgroundColor: "background.paper",
                  },
                }}
              />
            </Grid>
            <Grid sx={{p: 0}} size={{ xs: 1 }}>
              <IconButton
                type="submit"
                color="primary"
                sx={{ fontSize: { xs: '1.7rem', md: '2rem'} }}
                disabled={disabled}
              >
                {disabled ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <SendIcon fontSize="inherit"/>
                )}
              </IconButton>
            </Grid>
          </Grid>
        </Stack>
      </form>
      <SettingsModal
        open={state.open}
        onClose={closeModal}
        quality={quality}
        tone={tone}
        setQuality={setQuality}
        setTone={setTone}
        sendMethod={sendMethod}
        setSendMethod={setSendMethod}
      />
    </Box>
  );
}
