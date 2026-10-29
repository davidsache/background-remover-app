import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Modal } from "../components/Modal";

interface ModalData {
  title: string;
  message: string;
}

interface ModalContextType {
  openModal: (data: ModalData) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalData, setModalData] = useState<ModalData | null>(null);

  const openModal = useCallback((data: ModalData) => {
    setModalData(data);
  }, []);

  const closeModal = useCallback(() => {
    setModalData(null);
  }, []);

  return (
    <ModalContext.Provider value={{ openModal }}>
      {children}
      <Modal 
        isOpen={modalData != null}
        onClose={closeModal}
        title={modalData?.title ?? ""}
        message={modalData?.message ?? ""}
      />
    </ModalContext.Provider>
  );
}

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}