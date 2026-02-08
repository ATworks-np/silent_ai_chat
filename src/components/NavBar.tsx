"use client";

import { AppBar, Toolbar, Button, Box, Avatar, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { LoginModal } from "./LoginModal";
import useUser from "@/hooks/useUser";

export function NavBar() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { user } = useUser();

  const handleOpenLoginModal = () => {
    setLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
  };

  return (
    <>
      <AppBar position="fixed" color="primary">
        <Toolbar>
          <Box sx={{ flexGrow: 1 }} />
          {user.props.isAuthenticated ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography color="inherit">
                {user.props.displayName}
              </Typography>
              <Avatar 
                src={user.props.photoURL || undefined} 
                alt={user.props.displayName || "User"}
                sx={{ width: 32, height: 32 }}
              />
            </Stack>
          ) : (
            <Button color="inherit" onClick={handleOpenLoginModal}>
              ログイン
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <LoginModal
        open={loginModalOpen}
        onClose={handleCloseLoginModal}
      />
    </>
  );
}
