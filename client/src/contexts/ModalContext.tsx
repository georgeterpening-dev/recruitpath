/*
 * ModalContext — shared state for school modal open/close
 * Used by Dashboard (to set) and DockNav (to read and animate)
 *
 * The Dashboard registers an onClose callback so when the DockNav's
 * collapsed circle X button is clicked, it can also clear selectedSchool.
 */
import { createContext, useContext, useState, useCallback, useRef } from "react";

interface ModalContextValue {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  /** Dashboard registers this so DockNav's X button can close the modal */
  registerCloseCallback: (fn: () => void) => void;
  unregisterCloseCallback: () => void;
}

const ModalContext = createContext<ModalContextValue>({
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
  registerCloseCallback: () => {},
  unregisterCloseCallback: () => {},
});

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeCallbackRef = useRef<(() => void) | null>(null);

  const openModal = useCallback(() => setIsModalOpen(true), []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Also call the Dashboard's close callback if registered
    if (closeCallbackRef.current) {
      closeCallbackRef.current();
    }
  }, []);

  const registerCloseCallback = useCallback((fn: () => void) => {
    closeCallbackRef.current = fn;
  }, []);

  const unregisterCloseCallback = useCallback(() => {
    closeCallbackRef.current = null;
  }, []);

  return (
    <ModalContext.Provider value={{ isModalOpen, openModal, closeModal, registerCloseCallback, unregisterCloseCallback }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
