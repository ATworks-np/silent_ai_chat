"use client";

import React, {useEffect, useState} from "react";
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

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // useEffect(() => {
  //   // visualViewport APIが使えない環境へのガード
  //   if (!window.visualViewport) return;
  //
  //   const handleResize = () => {
  //     const visualViewport = window.visualViewport;
  //     if (!visualViewport) return;
  //
  //     // 【修正】高さの差分だけでなく、スクロールによるオフセット(offsetTop)も考慮する
  //     // これにより、キーボード表示中かつスクロールが発生している状態でも
  //     // 入力欄を視覚的な最下部に追従させることができます。
  //     // 計算式: レイアウト全体の高さ - (見えている高さ + 上からのズレ) = 下の隠れている部分の高さ
  //
  //     const offset = window.innerHeight - visualViewport.height + window.scrollY;
  //
  //     // 負の値になる場合（バウンススクロール等）は0にする
  //     setKeyboardHeight(offset);
  //   };
  //
  //   window.visualViewport.addEventListener('resize', handleResize);
  //   window.visualViewport.addEventListener('scroll', handleResize);
  //
  //   return () => {
  //     window.visualViewport?.removeEventListener('resize', handleResize);
  //     window.visualViewport?.removeEventListener('scroll', handleResize);
  //   };
  // }, []);

  useEffect(() => {
      const handleResize = () => {
        const visualViewport = window.visualViewport;
        if (!visualViewport) return;


        const offset = - visualViewport.offsetTop + window.innerHeight - visualViewport.height;

        // 負の値になる場合（バウンススクロール等）は0にする
        setKeyboardHeight(offset);
      };
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);


    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);


  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: keyboardHeight,
        zIndex: 1000,
        backgroundColor: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          transition: 'transform 0.10s ease-out',
          backgroundColor: "background.default",
          pointerEvents: 'auto',
          overscrollBehavior: 'contain',
          pb: keyboardHeight > 0 ? 0 : 'env(safe-area-inset-bottom)', // iPhone X系の下部バー対策
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <Stack spacing={1} sx={{ maxWidth: "800px", mx: "auto", p: 1 }}>
            <Grid container spacing={{ xs: 1, md: 2 }} alignItems="flex-end">
              <Grid size="auto">
                <IconButton
                  color="default"
                  aria-label="設定"
                  size="large"
                  onClick={openModal}
                  sx={{ mb: 0.5 }} // アイコンの位置微調整
                >
                  <TuneIcon />
                </IconButton>
              </Grid>
              <Grid size="grow">
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  maxRows={5} // あまり広がりすぎると邪魔なので5行くらい推奨
                  variant="outlined"
                  placeholder="メッセージを入力"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      backgroundColor: "background.paper",
                    },
                  }}
                />
              </Grid>
              <Grid size="auto" sx={{ display: 'flex', alignItems: 'flex-end', pb: 0.5 }}>
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={disabled || !value.trim()} // 空文字送信防止も入れておきました
                >
                  {disabled ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <SendIcon />
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
    </Box>
  );
}