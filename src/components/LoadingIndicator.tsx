"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

interface LoadingIndicatorProps {
  loading: boolean;
}

export default function LoadingIndicator({ loading }: LoadingIndicatorProps) {
  if (!loading) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
      <CircularProgress />
    </Box>
  );
}
