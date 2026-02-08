"use client";

import { Avatar, IconButton, Menu, Stack, Typography } from "@mui/material";
import { useNavBarMenu } from "@/hooks/useNavBarMenu";

interface NavBarMenuProps {
  displayName: string | null;
  photoURL: string | null;
}

export function NavBarMenu({ displayName, photoURL }: NavBarMenuProps) {
  const { anchorEl, open, handleOpen, handleClose } = useNavBarMenu();

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography color="inherit">
          {displayName}
        </Typography>
        <IconButton
          color="inherit"
          onClick={handleOpen}
          size="small"
          aria-controls={open ? "navbar-user-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <Avatar
            src={photoURL || undefined}
            alt={displayName || "User"}
            sx={{ width: 32, height: 32 }}
          />
        </IconButton>
      </Stack>

      <Menu
        id="navbar-user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        disableScrollLock
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: '200px'
            }
          },
        }}
      >

      </Menu>
    </>
  );
}
