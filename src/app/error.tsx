"use client";

import Image from "next/image";
import { Box, Button, Stack, Typography } from "@mui/material";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: ErrorProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack spacing={3} alignItems="center">
        <Image
          src="/icon.png"
          alt="Internal server error icon"
          width={96}
          height={96}
        />
        <Typography variant="h5" color="text.primary">
          Internal Server Error
        </Typography>
        <Button variant="outlined" color="primary" onClick={reset}>
          再読み込み
        </Button>
      </Stack>
    </Box>
  );
}
