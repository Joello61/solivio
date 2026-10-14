import type { MeResponse } from "@/types/auth";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  user: MeResponse;
  /* Lien vers la distribution du jour, quand le membre y participe. */
  jourJ?: string;
  children: React.ReactNode;
}

export function AppShell({ user, jourJ, children }: AppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <a
        href="#contenu"
        className="sr-only z-50 rounded-lg bg-card px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <Sidebar user={user} jourJ={jourJ} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar user={user} />
        <main id="contenu" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
            {children}
          </div>
        </main>
      </div>
      <BottomNav user={user} jourJ={jourJ} />
    </div>
  );
}
