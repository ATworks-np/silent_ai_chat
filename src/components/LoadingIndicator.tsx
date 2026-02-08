"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useEffect, useRef } from "react";

interface LoadingIndicatorProps {
  loading: boolean;
  autoScroll?: boolean;
}

export default function LoadingIndicator({ loading, autoScroll = false }: LoadingIndicatorProps) {
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading && autoScroll && loadingRef.current) {
      // Calculate position to center the element in the viewport
      const elementRect = loadingRef.current.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const middle = absoluteElementTop - (window.innerHeight / 2) + (elementRect.height / 2);
      window.scrollTo({
        top: middle,
        behavior: 'smooth'
      });
    }
  }, [loading, autoScroll]);

  if (!loading) {
    return null;
  }

  return (
    <Box ref={loadingRef} sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
      <CircularProgress />
    </Box>
  );
}
