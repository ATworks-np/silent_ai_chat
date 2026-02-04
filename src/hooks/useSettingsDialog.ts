import { useCallback, useState } from "react";

export interface SettingsDialogState {
  open: boolean;
}

export interface UseSettingsDialogResult {
  state: SettingsDialogState;
  openDialog: () => void;
  closeDialog: () => void;
}

export function useSettingsDialog(): UseSettingsDialogResult {
  const [state, setState] = useState<SettingsDialogState>({ open: false });

  const openDialog = useCallback(() => {
    setState({ open: true });
  }, []);

  const closeDialog = useCallback(() => {
    setState({ open: false });
  }, []);

  return { state, openDialog, closeDialog };
}
