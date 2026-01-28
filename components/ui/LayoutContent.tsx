"use client";

import { useNavbar } from "./NavbarContext";
import { cn } from "@/lib/utils";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { dockVisible } = useNavbar();
  return (
    <div className={cn("relative z-10 transition-[padding] duration-300", dockVisible && "pb-24")}>
      {children}
    </div>
  );
}
