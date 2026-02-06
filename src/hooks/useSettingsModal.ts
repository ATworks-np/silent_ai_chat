import { useCallback, useState } from "react";

export interface SettingsModalState {
  open: boolean;
}

export interface UseSettingsModalResult {
  state: SettingsModalState;
  openModal: () => void;
  closeModal: () => void;
}

export function useSettingsModal(): UseSettingsModalResult {
  const [state, setState] = useState<SettingsModalState>({ open: false });

  const openModal = useCallback(() => {
    setState({ open: true });
  }, []);

  const closeModal = useCallback(() => {
    setState({ open: false });
  }, []);

  return { state, openModal, closeModal };
}
