"use client";

import { Drawer, List, ListItem, ListItemButton, ListItemText, Box, Typography, Divider, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { SidebarActions, SidebarState } from "@/models/interfaces/sidebar";
import { useArchivedMessages } from "@/hooks/useArchivedMessages";
import { useState, useEffect } from "react";
import {useSetAtom} from "jotai";
import {scrollTargetIdAtom} from "@/stores/scrollToMessage";


interface SidebarProps {
  state: SidebarState;
  actions: SidebarActions;
}

export function Sidebar({ state, actions }: SidebarProps) {
  const { messages, loading, error } = useArchivedMessages();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("xl"));
  const [mounted, setMounted] = useState(false);
  const setScrollTarget = useSetAtom(scrollTargetIdAtom);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Drawer
      anchor="left"
      open={mounted ? (isMobile ? state.isOpen : true) : false}
      onClose={actions.close}
      variant={mounted ? (isMobile ? "temporary" : "permanent") : "temporary"}
      sx={{
        "& .MuiDrawer-paper": {
          width: 320,
          boxSizing: "border-box",
          pt: { xs: 0, xl: 8 },
          // マウント前は非表示にするための追加設定
          visibility: mounted ? "visible" : "hidden",
        },
      }}
    >
      <Box sx={{ width: 320 }} role="presentation">
        <Divider />
        <Box sx={{ p: 1 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : error ? (
            <Typography color="error" variant="body2" sx={{ px: 2, py: 1 }}>
              {error}
            </Typography>
          ) : (
            <List>
              {messages.length === 0 ? (
                <ListItem>
                  <ListItemText primary="アーカイブは空です" secondary="会話をアーカイブするとここに表示されます" />
                </ListItem>
              ) : (
                messages.map((m) => (
                  <ListItem key={m.messageId} disablePaddin>
                    <ListItemButton onClick={() => {
                      actions.close();
                      setScrollTarget(m.messageId);
                      }}>
                      <ListItemText
                        primary={m.content?.split("\n")[0]?.slice(0, 40) || "(無題)"}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
            </List>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
