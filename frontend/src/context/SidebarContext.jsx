import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [open,           setOpen]           = useState(true);   // expanded by default
  const [activeCategory, setActiveCategory] = useState('Home');

  const toggle = () => setOpen(o => !o);
  const close  = () => setOpen(false);

  return (
    <SidebarContext.Provider value={{ open, toggle, close, activeCategory, setActiveCategory }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
