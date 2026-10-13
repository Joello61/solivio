"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { bottomNavItems, isNavItemActive } from "./navigation";

export function BottomNav({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const items = bottomNavItems(roles);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation mobile"
    >
      {/* Barre de navigation avec blur et bordure */}
      <div className="border-t border-border/60 bg-background/95 backdrop-blur-md shadow-lg">
        <div className="flex items-stretch">
          {items.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 pt-2.5 pb-2 px-1 transition-all duration-150"
                aria-current={active ? "page" : undefined}
              >
                {/* Indicateur pilule */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-xl px-4 py-1.5 transition-all duration-200",
                    active ? "bg-primary shadow-primary" : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      active ? "text-primary-foreground" : "text-muted-foreground",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] font-semibold leading-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
