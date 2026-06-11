import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  SlidersHorizontal,
  Users,
  UserCog,
  Building2,
  Package,
  Recycle,
  Truck,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/distributions", label: "Distributions", icon: CalendarDays },
      { href: "/reconditionnement", label: "Reconditionnement", icon: Recycle },
      { href: "/missions-collecte", label: "Missions collecte", icon: Truck },
      { href: "/mes-missions-collecte", label: "Mes missions", icon: Truck, roles: ["benevole"] },
      { href: "/mes-inscriptions", label: "Mes inscriptions", icon: ClipboardList },
    ],
  },
  {
    title: "Association",
    items: [
      {
        href: "/association/configuration",
        label: "Configuration",
        icon: SlidersHorizontal,
        roles: ["coordinateur", "responsable", "super_admin"],
      },
      {
        href: "/association/membres",
        label: "Membres",
        icon: Users,
        roles: ["coordinateur", "responsable", "super_admin"],
      },
      {
        href: "/association/catalogue-denrees",
        label: "Catalogue denrees",
        icon: Package,
        roles: ["responsable", "super_admin"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        href: "/admin/utilisateurs",
        label: "Utilisateurs",
        icon: UserCog,
        roles: ["super_admin"],
      },
      {
        href: "/admin/associations",
        label: "Associations",
        icon: Building2,
        roles: ["super_admin"],
      },
    ],
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/distributions", label: "Distributions", icon: CalendarDays },
  { href: "/mes-inscriptions", label: "Inscriptions", icon: ClipboardList },
];

export function filterNavItems(items: NavItem[], roles: string[]): NavItem[] {
  return items.filter(
    (item) => !item.roles || item.roles.some((r) => roles.includes(r)),
  );
}

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}
