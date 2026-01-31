"use client";

import { useNavbar } from "./NavbarContext";
import { cn } from "@/lib/utils";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const { dockVisible } = useNavbar();
  return (
    <div
      className={cn(
        "relative z-10 transition-[padding] duration-200",
        dockVisible && "pb-16",
      )}
    >
      {children}
    </div>
  );
}
