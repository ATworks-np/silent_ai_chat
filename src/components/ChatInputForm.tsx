"use client";

import {Box, Grid } from "@mui/material";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";

interface ChatInputFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export default function ChatInputForm({ value, onChange, onSubmit, disabled = false }: ChatInputFormProps) {
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
        <Grid container spacing={2} sx={{ maxWidth: "800px", mx: "auto" }}  alignItems="flex-end">
          <Grid size={{ xs: 11 }}>
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
      </form>
    </Box>
  );
}
