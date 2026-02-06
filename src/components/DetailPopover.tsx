"use client";

import Box from "@mui/material/Box";
import Slide from "@mui/material/Slide";
import Fade from "@mui/material/Fade";
import type { SxProps, Theme } from "@mui/material/styles";
import RoundedButton from "./RoundedButton";

interface DetailPopoverProps {
  open: boolean;
  // 以前はアンカー位置でポップオーバー表示していたが、
  // 現在は画面下部スライドイン表示のため位置情報は利用しない
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  onMoreDetails: () => void;
  disabled?: boolean;
}

const containerSx: SxProps<Theme> = {
  position: "fixed",
  left: 0,
  right: 0,
  // ChatInputForm の直上に重なるように、少しだけ余白をあける
  bottom: 96,
  display: "flex",
  justifyContent: "center",
  pointerEvents: "none",
  zIndex: (theme) => theme.zIndex.modal,
};

const innerSx: SxProps<Theme> = {
  pointerEvents: "auto",
};

export default function DetailPopover({ open, anchorPosition: _anchorPosition, onClose, onMoreDetails, disabled = false }: DetailPopoverProps) {
  const handleClick = () => {
    if (disabled) return;

    onMoreDetails();
    onClose();
  };

  return (
    <Fade in={open} timeout={200}>
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box sx={containerSx}>
          <Box sx={innerSx}>
            <RoundedButton
              variant="contained"
              color="primary"
              onClick={handleClick}
              disabled={disabled}
            >
              もっとくわしく
            </RoundedButton>
          </Box>
        </Box>
      </Slide>
    </Fade>
  );
}
