"use client";

import type { ReactNode } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import Modal from "@mui/material/Modal";
import CloseIcon from "@mui/icons-material/Close";

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  maxWidth?: number;
}

export function BaseModal({ open, onClose, title, children, maxWidth = 480 }: BaseModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby={title ? "base-modal-title" : undefined}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(6px)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%",
          maxWidth,
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          p: 6,
        }}
      >
        <IconButton
          aria-label="閉じる"
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
        <Stack spacing={2}>
          {title ? (
            <Typography id="base-modal-title" variant="h6" component="h2">
              {title}
            </Typography>
          ) : null}
          {children}
        </Stack>
      </Box>
    </Modal>
  );
}
