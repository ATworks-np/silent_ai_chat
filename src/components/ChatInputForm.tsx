"use client";

import { Box, Grid, Stack } from "@mui/material";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import TuneIcon from "@mui/icons-material/Tune";
import { useSettingsDialog } from "@/hooks/useSettingsDialog";
import { SettingsModal } from "@/components/SettingsModal";
import type { AnswerQuality, AnswerTone } from "@/hooks/useChatSettings";

interface ChatInputFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
  quality: AnswerQuality;
  tone: AnswerTone;
  setQuality: (quality: AnswerQuality) => void;
  setTone: (tone: AnswerTone) => void;
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
}: ChatInputFormProps) {
  const { state, openDialog, closeDialog } = useSettingsDialog();

  return (
    <Box sx={{ 
      position: "fixed", 
      bottom: 0, 
      left: 0, 
      right: 0, 
      backgroundColor: "background.default",
      p: 3,
      zIndex: 1000,
    }}>
      <form onSubmit={onSubmit}>
        <Stack spacing={1} sx={{ maxWidth: "800px", mx: "auto" }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 1 }}>
              <IconButton color="default" aria-label="設定" size="large" onClick={openDialog}>
                <TuneIcon />
              </IconButton>
            </Grid>
            <Grid size={{ xs: 10 }}>
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 5,
                    backgroundColor: "background.paper",
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 1 }}>
              <IconButton
                type="submit"
                color="primary"
                size="large"
                disabled={disabled}
              >
                <SendIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Stack>
      </form>
      <SettingsModal
        open={state.open}
        onClose={closeDialog}
        quality={quality}
        tone={tone}
        setQuality={setQuality}
        setTone={setTone}
      />
    </Box>
  );
}
