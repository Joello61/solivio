"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import type { MeResponse } from "@/types/auth";

interface AppShellProps {
  user: MeResponse;
  children: React.ReactNode;
}

const SIDEBAR_STATE_KEY = "solivio-sidebar-collapsed";

function readSidebarState(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_STATE_KEY) === "true";
}

export function AppShell({ user, children }: AppShellProps) {
  /* Lazy initializer : lit localStorage uniquement cote client. */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarState);

  function handleCollapseToggle() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STATE_KEY, String(next));
      return next;
    });
  }

  return (
    <>
      <div className="flex h-dvh overflow-hidden bg-background">
        <Sidebar
          user={user}
          collapsed={sidebarCollapsed}
          onCollapseToggle={handleCollapseToggle}
        />

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 pb-24 lg:pb-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>

      <BottomNav roles={user.roles} />
    </>
  );
}
