"use client";

import { useState } from "react";
import { SidebarHook } from "@/models/interfaces/sidebar";

export const useSidebar = (): SidebarHook => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  const open = () => {
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  return {
    state: {
      isOpen,
    },
    actions: {
      toggle,
      open,
      close,
    },
  };
};
