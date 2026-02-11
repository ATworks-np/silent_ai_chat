export interface SidebarState {
  isOpen: boolean;
}

export interface SidebarActions {
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export interface SidebarHook {
  state: SidebarState;
  actions: SidebarActions;
}
