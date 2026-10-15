import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  House,
  Mail,
  Package,
  PartyPopper,
  Recycle,
  SlidersHorizontal,
  Tags,
  Truck,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { estGestionnaireDistribution } from "@/lib/droits-distribution";

export interface NavItem {
  href: string;
  label: string;
  /* Libelle pour un gestionnaire, quand l'intention differe ("Planning" plutot qu'"Agenda"). */
  labelGestion?: string;
  /* Libelle pour l'equipe (tout membre non beneficiaire). */
  labelEquipe?: string;
  icon: LucideIcon;
  roles?: string[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

const GESTION = ["coordinateur", "responsable", "super_admin"];
const RESPONSABLES = ["responsable", "super_admin"];

const ACCUEIL: NavItem = { href: "/dashboard", label: "Accueil", labelGestion: "Aujourd'hui", icon: House };
const AGENDA: NavItem = { href: "/distributions", label: "Agenda", labelGestion: "Planning", icon: CalendarDays };
// Distributions, evenements, missions et sessions reunis.
const INSCRIPTIONS: NavItem = {
  href: "/mes-inscriptions",
  label: "Mes inscriptions",
  labelEquipe: "Mes engagements",
  icon: ClipboardList,
};
const MISSIONS: NavItem = {
  href: "/missions-collecte",
  label: "Missions de collecte",
  icon: Truck,
  roles: ["benevole", ...GESTION],
};
const STATISTIQUES: NavItem = { href: "/statistiques", label: "Statistiques", icon: BarChart3, roles: GESTION };

/* Rubrique hors menu (on y accede par l'avatar), utile pour le retour depuis ses sous-pages. */
export const COMPTE: NavItem = { href: "/mon-compte", label: "Mon compte", icon: UserRound };

/* Navigation groupee par intention : ce que je fais, les autres activites, le pilotage. */
export const NAV_SECTIONS: NavSection[] = [
  { items: [ACCUEIL, AGENDA, INSCRIPTIONS] },
  {
    title: "Activités",
    items: [
      { href: "/evenements", label: "Événements", icon: PartyPopper },
      MISSIONS,
      { href: "/reconditionnement", label: "Reconditionnement", icon: Recycle },
    ],
  },
  { title: "Pilotage", items: [STATISTIQUES] },
  {
    title: "Association",
    items: [
      { href: "/association/membres", label: "Membres", icon: Users, roles: RESPONSABLES },
      {
        href: "/association/roles-benevoles",
        label: "Rôles bénévoles",
        icon: Tags,
        roles: ["coordinateur", "responsable"],
      },
      { href: "/association/catalogue-denrees", label: "Catalogue des denrées", icon: Package, roles: RESPONSABLES },
      { href: "/association/configuration", label: "Réglages", icon: SlidersHorizontal, roles: RESPONSABLES },
      { href: "/notifications/email-libre", label: "Message aux membres", icon: Mail, roles: RESPONSABLES },
    ],
  },
  {
    title: "Administration",
    items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", icon: UserCog, roles: ["super_admin"] }],
  },
];

export function filterNavItems(items: NavItem[], roles: string[]): NavItem[] {
  return items.filter((item) => !item.roles || item.roles.some((r) => roles.includes(r)));
}

/* Sections visibles pour ces roles, sans section vide. */
export function sectionsPourRoles(roles: string[]): NavSection[] {
  return NAV_SECTIONS.map((s) => ({ ...s, items: filterNavItems(s.items, roles) })).filter(
    (s) => s.items.length > 0,
  );
}

export function libelleNav(item: NavItem, roles: string[]): string {
  if (item.labelGestion && estGestionnaireDistribution(roles)) return item.labelGestion;
  if (item.labelEquipe && !roles.includes("beneficiaire")) return item.labelEquipe;
  return item.label;
}

/**
 * Barre basse mobile : trois destinations utiles au role, la quatrieme case ouvre le
 * menu complet. Le jour d'une distribution, le gestionnaire ou le benevole qui y
 * participe trouve le pointage a la place de la troisieme.
 */
export function bottomNavItems(roles: string[], pointageDuJour?: string): NavItem[] {
  const troisieme: NavItem = pointageDuJour
    ? { href: pointageDuJour, label: "Jour J", icon: ClipboardCheck }
    : estGestionnaireDistribution(roles)
      ? STATISTIQUES
      : roles.includes("benevole")
        ? { ...MISSIONS, label: "Missions" }
        : { ...INSCRIPTIONS, label: "Inscriptions" };
  return [ACCUEIL, AGENDA, troisieme];
}

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

/* Entree la plus precise qui contient la page courante. */
export function itemActif(items: NavItem[], pathname: string): NavItem | undefined {
  return items
    .filter((item) => isNavItemActive(item.href, pathname))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
