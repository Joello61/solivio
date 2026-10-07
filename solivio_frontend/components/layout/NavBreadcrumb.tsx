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
  nouvelle: "Nouvelle distribution",
  "mes-inscriptions": "Mes inscriptions",
  "mon-compte": "Mon compte",
  "profil-beneficiaire": "Profil beneficiaire",
  association: "Association",
  configuration: "Configuration",
  membres: "Membres",
  admin: "Administration",
  utilisateurs: "Utilisateurs",
  pointage: "Pointage",
  repartition: "Repartition",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function labelFor(segment: string): string {
  if (UUID_RE.test(segment)) return "Detail";
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
