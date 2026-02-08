"use client";

import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useState } from "react";
import { LoginModal } from "./LoginModal";
import useUser from "@/hooks/useUser";
import { NavBarMenu } from "./NavBarMenu";

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
            <NavBarMenu
              displayName={user.props.displayName}
              photoURL={user.props.photoURL}
            />
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
