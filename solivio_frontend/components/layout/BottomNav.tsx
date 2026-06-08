"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS, isNavItemActive } from "./navigation";

const ITEMS = [
  ...BOTTOM_NAV_ITEMS,
  { href: "/mon-compte", label: "Compte", icon: CircleUser },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation mobile"
    >
      <div className="flex items-stretch">
        {ITEMS.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 pt-2.5 pb-2 px-1 transition-colors"
              aria-current={active ? "page" : undefined}
            >
              {/* Indicateur pilule autour de l'icone */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full px-4 py-1 transition-all duration-200",
                  active ? "bg-primary/10" : "bg-transparent",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium leading-none transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
