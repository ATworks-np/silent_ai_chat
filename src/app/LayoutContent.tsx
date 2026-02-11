"use client";

import React from "react";
import { Box } from "@mui/material";
import { NavBar } from "@/components/NavBar";
import { Sidebar } from "@/components/Sidebar";
import { useSidebar } from "@/hooks/useSidebar";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { state, actions } = useSidebar();

  return (
    <>
      <NavBar sidebarActions={actions} />
      <Sidebar state={state} actions={actions} />
      <Box
        sx={{
          pt: 8,
          pl: { xs: 0, xl: "320px" },
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {children}
      </Box>
    </>
  );
}
