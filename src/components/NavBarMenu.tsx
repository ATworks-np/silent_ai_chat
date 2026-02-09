"use client";

import { Avatar, Box, IconButton, LinearProgress, Menu, MenuItem, Skeleton, Stack, Typography, Divider } from "@mui/material";
import { useNavBarMenu } from "@/hooks/useNavBarMenu";
import { useUserGemBalance } from "@/hooks/useUserGemBalance";
import DiamondIcon from '@mui/icons-material/Diamond';
import { getAuth, signOut } from "firebase/auth";

interface NavBarMenuProps {
  displayName: string | null;
  photoURL: string | null;
  isGuest: boolean;
  onOpenLoginModal: () => void;
}

export function NavBarMenu({ displayName, photoURL, isGuest, onOpenLoginModal }: NavBarMenuProps) {
  const { anchorEl, open, handleOpen, handleClose } = useNavBarMenu();
  const { maxGem, usedGem, remainingGem, loading, error, refresh } = useUserGemBalance();

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } finally {
      handleClose();
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography color="inherit">
          {displayName}
        </Typography>
        <IconButton
          color="inherit"
          onClick={(event) => {
            refresh();
            handleOpen(event);
          }}
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
              width: "260px",
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
              {loading ? (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
                    今月の残り
                  </Typography>
                  <Skeleton variant="rectangular" width={18} height={16} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 1 }}>
                    / {Number(maxGem).toFixed(2)}
                  </Typography>
                  <DiamondIcon fontSize="small" />
                </>
              ) : (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    今月の残り {Number(remainingGem).toFixed(2)} / {Number(maxGem).toFixed(2)}
                  </Typography>
                  <DiamondIcon fontSize="small" />
                </>
              )}
            </Stack>
            {loading ? (
              <LinearProgress variant="indeterminate" />
            ) : error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : maxGem === null || usedGem === null || remainingGem === null ? (
              <Typography variant="body2" color="text.secondary">
                プラン情報が設定されていません。
              </Typography>
            ) : (
              <>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.max(0, ((maxGem-usedGem) / maxGem) * 100))}
                />
              </>
            )}
          </Stack>
        </Box>

        <Divider />
        {isGuest ? (
          <MenuItem
            onClick={() => {
              handleClose();
              onOpenLoginModal();
            }}
          >
            <Typography variant="body2" color="text.primary">
              ログイン
            </Typography>
          </MenuItem>
        ) : (
          <MenuItem onClick={handleLogout}>
            <Typography variant="body2" color="text.primary">
              ログアウト
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
