"use client";

import { AppBar, Toolbar, Button, Box, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { LoginModal } from "@/components/LoginModal";
import useUser from "@/hooks/useUser";
import { NavBarMenu } from "@/components/NavBarMenu";
import CircularProgress from "@mui/material/CircularProgress";
import RoundedButton from "@/components/RoundedButton";

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
              isGuest={user.props.plan?.name === "guest"}
              onOpenLoginModal={handleOpenLoginModal}
            />
          ) : (
            <CircularProgress size={30} color='inherit'/>
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
