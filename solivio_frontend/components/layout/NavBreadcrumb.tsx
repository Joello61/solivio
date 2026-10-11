"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  distributions: "Distributions",
  nouvelle: "Nouvelle",
  "mes-inscriptions": "Mes inscriptions",
  "mon-compte": "Mon compte",
  "profil-beneficiaire": "Profil bénéficiaire",
  association: "Association",
  configuration: "Configuration",
  membres: "Membres",
  admin: "Administration",
  utilisateurs: "Utilisateurs",
  pointage: "Pointage",
  repartition: "Répartition",
  evenements: "Événements",
  nouveau: "Nouveau",
  modifier: "Modifier",
  "mes-evenements": "Mes événements",
  "missions-collecte": "Missions collecte",
  "mes-missions-collecte": "Mes missions",
  reconditionnement: "Reconditionnement",
  notifications: "Notifications",
  "email-libre": "Email aux membres",
  "catalogue-denrees": "Catalogue des denrées",
  "roles-benevoles": "Rôles bénévoles",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function labelFor(segment: string): string {
  if (UUID_RE.test(segment)) return "Détail";
  return LABELS[segment] ?? segment;
}

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  return pathname
    .split("/")
    .filter(Boolean)
    .reduce<Crumb[]>((acc, segment) => {
      const href = (acc.at(-1)?.href ?? "") + "/" + segment;
      return [...acc, { label: labelFor(segment), href }];
    }, []);
}

export function NavBreadcrumb() {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <BreadcrumbItem key={crumb.href}>
              {isLast ? (
                <BreadcrumbPage className="font-medium">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
