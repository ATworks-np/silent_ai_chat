"use client";

import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import RoundedButton from "./RoundedButton";

interface DetailPopoverProps {
  open: boolean;
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  onMoreDetails: () => void;
  disabled?: boolean;
}

export default function DetailPopover({ open, anchorPosition, onClose, onMoreDetails, disabled = false }: DetailPopoverProps) {
  return (
    <Popover
      open={open}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition || undefined}
      onClose={onClose}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
    >
      <Box sx={{ p: 2 }}>
        <RoundedButton 
          variant="contained" 
          color="primary"
          onClick={onMoreDetails}
          disabled={disabled}
        >
          もっとくわしく
        </RoundedButton>
      </Box>
    </Popover>
  );
}
