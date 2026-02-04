"use client";

import { Box, Slider, Stack, Typography } from "@mui/material";
import { BaseModal } from "./BaseModal";
import { useChatSettings } from "../hooks/useChatSettings";

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

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

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { quality, tone, setQuality, setTone } = useChatSettings();

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
      </Stack>
    </BaseModal>
  );
}
