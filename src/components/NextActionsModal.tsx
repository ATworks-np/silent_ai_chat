"use client";

import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import { Grid } from "@mui/material";
import RoundedButton from "./RoundedButton";

interface NextActionsModalProps {
  open: boolean;
  actions: string[];
  loading?: boolean;
  onActionClick: (action: string) => void;
  onNotResolved: () => void;
  onClose: () => void;
}

export default function NextActionsModal({
  open,
  actions,
  loading = false,
  onActionClick,
  onNotResolved,
  onClose,
}: NextActionsModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 200,
        },
      }}
    >
      <Fade in={open} timeout={200}>
        <Box
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 96,
            display: "flex",
            justifyContent: "center",
            outline: "none",
          }}
          onClick={(event) => {
            // モーダル内クリックでバブリングを止めて背景クリック扱いにしない
            event.stopPropagation();
          }}
        >
          <Box
            sx={{
              maxWidth: "800px",
              width: "100%",
              px: 3,
            }}
          >
            <Box
              sx={{
                bgcolor: "background.paper",
                borderRadius: 3,
                boxShadow: 3,
                p: 2,
              }}
            >
              <Grid container spacing={1} alignItems="center">
                {actions.slice(0, 2).map((action) => (
                  <Grid key={action} size={{ xs: 12, md: 5 }}>
                    <RoundedButton
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        if (loading) return;
                        onActionClick(action);
                      }}
                      disabled={loading}
                    >
                      {action}
                    </RoundedButton>
                  </Grid>
                ))}
                <Grid size={{ xs: 12, md: 2 }}>
                  <RoundedButton
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      if (loading) return;
                      onNotResolved();
                    }}
                    disabled={loading}
                  >
                    未解決
                  </RoundedButton>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
