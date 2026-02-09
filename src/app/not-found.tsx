"use client";

import Image from "next/image";
import { Box, Stack, Typography } from "@mui/material";

export default function NotFound() {
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
          alt="Not found icon"
          width={96}
          height={96}
        />
        <Typography variant="h5" color="text.primary">
          Not found
        </Typography>
      </Stack>
    </Box>
  );
}
