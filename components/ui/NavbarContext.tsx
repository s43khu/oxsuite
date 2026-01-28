"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface NavbarContextValue {
  dockVisible: boolean;
  setDockVisible: (v: boolean) => void;
}

const NavbarContext = createContext<NavbarContextValue | undefined>(undefined);

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [dockVisible, setDockVisible] = useState(false);
  return (
    <NavbarContext.Provider value={{ dockVisible, setDockVisible }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  const ctx = useContext(NavbarContext);
  if (ctx === undefined) {
    throw new Error("useNavbar must be used within NavbarProvider");
  }
  return ctx;
}
