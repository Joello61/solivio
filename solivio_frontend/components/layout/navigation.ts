import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  SlidersHorizontal,
  Users,
  UserCog,
  Package,
  Recycle,
  Truck,
  PartyPopper,
  Mail,
  Tags,
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
      {
        href: "/missions-collecte",
        label: "Missions collecte",
        icon: Truck,
        roles: ["benevole", "coordinateur", "responsable", "super_admin"],
      },
      {
        href: "/mes-missions-collecte",
        label: "Mes missions",
        icon: Truck,
        roles: ["benevole", "coordinateur", "responsable"],
      },
      { href: "/evenements", label: "Événements", icon: PartyPopper },
      { href: "/mes-evenements", label: "Mes événements", icon: PartyPopper, roles: ["benevole", "beneficiaire"] },
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
        roles: ["responsable", "super_admin"],
      },
      {
        href: "/association/membres",
        label: "Membres",
        icon: Users,
        roles: ["responsable", "super_admin"],
      },
      {
        href: "/association/roles-benevoles",
        label: "Rôles bénévoles",
        icon: Tags,
        roles: ["coordinateur", "responsable"],
      },
      {
        href: "/association/catalogue-denrees",
        label: "Catalogue denrées",
        icon: Package,
        roles: ["responsable", "super_admin"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        href: "/notifications/email-libre",
        label: "Email aux membres",
        icon: Mail,
        roles: ["responsable", "super_admin"],
      },
      {
        href: "/admin/utilisateurs",
        label: "Utilisateurs",
        icon: UserCog,
        roles: ["super_admin"],
      },
    ],
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
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
