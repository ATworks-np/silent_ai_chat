"use client";

import CircularProgress from "@mui/material/CircularProgress";
import { BaseModal } from "./BaseModal";
import { Stack } from "@mui/material";

interface LoadingIndicatorProps {
  loading: boolean;
}

export default function LoadingIndicator({ loading }: LoadingIndicatorProps) {
  if (!loading) {
    return null;
  }

  return (
    <BaseModal
      open={loading}
      onClose={() => {}} // Empty function as we don't want to close the modal on user action
      maxWidth={300}
    >
      <Stack alignItems="center" spacing={2}>
        <CircularProgress />
      </Stack>
    </BaseModal>
  );
}
