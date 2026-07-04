import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { MiniPlayer } from "./MiniPlayer";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className={`mx-auto max-w-2xl ${hideNav ? "" : "pb-32"}`}>{children}</main>
      {!hideNav && <MiniPlayer />}
      {!hideNav && <BottomNav />}
    </div>
  );
}
