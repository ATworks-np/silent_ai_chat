"use client";

import { Box, Slider, Stack, Typography, RadioGroup, FormControlLabel, Radio, useMediaQuery, useTheme } from "@mui/material";
import { BaseModal } from "./BaseModal";
import type { AnswerQuality, AnswerTone, ChatSendMethod } from "@/hooks/useChatSettings";

const QUALITY_ORDER = ["simple", "normal", "detailed"] as const;

const QUALITY_MARKS = [
  { value: 0, label: "簡素" },
  { value: 1, label: "普通" },
  { value: 2, label: "詳細" },
];

const TONE_ORDER = ["casual", "normal", "strict"] as const;

const TONE_MARKS = [
  { value: 0, label: "カジュアル" },
  { value: 1, label: "普通" },
  { value: 2, label: "きっちり" },
];

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  quality: AnswerQuality;
  tone: AnswerTone;
  setQuality: (quality: AnswerQuality) => void;
  setTone: (tone: AnswerTone) => void;
  sendMethod: ChatSendMethod;
  setSendMethod: (method: ChatSendMethod) => void;
}

export function SettingsModal({ open, onClose, quality, tone, setQuality, setTone, sendMethod, setSendMethod }: SettingsModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const sliderValue = QUALITY_ORDER.indexOf(quality);
  const toneSliderValue = TONE_ORDER.indexOf(tone);

  const handleQualityChange = (_event: Event, value: number | number[]) => {
    if (typeof value !== "number") {
      return;
    }

    const nextQuality = QUALITY_ORDER[value];
    if (nextQuality) {
      setQuality(nextQuality);
    }
  };

  const handleToneChange = (_event: Event, value: number | number[]) => {
    if (typeof value !== "number") {
      return;
    }

    const nextTone = TONE_ORDER[value];
    if (nextTone) {
      setTone(nextTone);
      }
  };

  const handleSendMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value === "enter" || value === "ctrlEnter") {
      setSendMethod(value);
    }
  };

  return (
    <BaseModal open={open} onClose={onClose} title="設定">
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            回答の質
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              track={false}
              value={sliderValue}
              min={0}
              max={2}
              step={1}
              marks={QUALITY_MARKS}
              onChange={handleQualityChange}
              aria-labelledby="answer-quality-slider"
            />
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            話し方
          </Typography>
          <Box sx={{ px: 1 }}>
            <Slider
              track={false}
              value={toneSliderValue}
              min={0}
              max={2}
              step={1}
              marks={TONE_MARKS}
              valueLabelDisplay="off"
              onChange={handleToneChange}
              aria-labelledby="answer-tone-slider"
            />
          </Box>
        </Box>
        {!isMobile && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              送信方法
            </Typography>
            <RadioGroup
              row
              name="chat-send-method"
              value={sendMethod}
              onChange={handleSendMethodChange}
              aria-label="chat send method"
            >
              <FormControlLabel
                value="enter"
                control={<Radio color="primary" />}
                sx={{
                  "& .MuiFormControlLabel-label": {
                    color: sendMethod === "enter" ? "text.primary" : "text.secondary",
                  },
                }}
                label="Enter で送信"
              />
              <FormControlLabel
                value="ctrlEnter"
                control={<Radio color="primary" />}
                sx={{
                  "& .MuiFormControlLabel-label": {
                    color: sendMethod === "ctrlEnter" ? "text.primary" : "text.secondary",
                  },
                }}
                label="Ctrl + Enter で送信"
              />
            </RadioGroup>
          </Box>
        )}
      </Stack>
    </BaseModal>
  );
}
