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
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navigation mobile"
    >
      {/* Barre de navigation avec blur et bordure */}
      <div className="border-t border-border/60 bg-primary-foreground/95 backdrop-blur-md shadow-lg">
        <div className="flex items-stretch">
          {ITEMS.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-1 pt-3 pb-2.5 px-1 transition-all duration-150"
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
                    "text-[10px] font-semibold leading-none transition-colors",
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
