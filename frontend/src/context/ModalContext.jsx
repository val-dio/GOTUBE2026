import { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState(null); // null | 'about' | 'faqs' | 'contact'

  return (
    <ModalContext.Provider value={{ modal, open: setModal, close: () => setModal(null) }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
