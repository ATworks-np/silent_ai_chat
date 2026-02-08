"use client";

import { useCallback, useState } from "react";

export interface UseNavBarMenuReturn {
  anchorEl: HTMLElement | null;
  open: boolean;
  handleOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleClose: () => void;
}

export function useNavBarMenu(): UseNavBarMenuReturn {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  return {
    anchorEl,
    open: Boolean(anchorEl),
    handleOpen,
    handleClose,
  };
}
