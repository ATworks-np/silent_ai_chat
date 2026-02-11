"use client";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

interface LoadingModalProps {
  open: boolean;
  message?: string;
}

export default function LoadingModal({ open, message = "処理中..." }: LoadingModalProps) {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          borderRadius: 2,
          px: 4,
          py: 3,
        },
      }}
    >
      <DialogContent>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress color="primary" />
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
