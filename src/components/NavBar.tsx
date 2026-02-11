"use client";

import { AppBar, Toolbar, Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";
import { LoginModal } from "@/components/LoginModal";
import useUser from "@/hooks/useUser";
import { NavBarMenu } from "@/components/NavBarMenu";
import CircularProgress from "@mui/material/CircularProgress";
import { SidebarActions } from "@/models/interfaces/sidebar";

interface NavBarProps {
  sidebarActions: SidebarActions;
}

export function NavBar({ sidebarActions }: NavBarProps) {
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
      <AppBar
        position="fixed"
        color="primary"
        sx={{
          zIndex: (theme) => ({ xs: theme.zIndex.drawer - 1, xl: theme.zIndex.drawer + 1 }),
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ 
              mr: 2,
              display: { xs: 'inline-flex', xl: 'none' }
            }}
            onClick={sidebarActions.open}
          >
            <MenuIcon />
          </IconButton>
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
