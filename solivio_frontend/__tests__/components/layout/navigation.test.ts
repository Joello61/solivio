import { describe, it, expect } from "vitest";
import {
  filterNavItems,
  isNavItemActive,
  NAV_SECTIONS,
} from "@/components/layout/navigation";
import type { NavItem } from "@/components/layout/navigation";

const itemBase: NavItem = {
  href: "/test",
  label: "Test",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: null as any,
};

describe("filterNavItems", () => {
  it("retourne tous les items sans restriction de role", () => {
    const items: NavItem[] = [itemBase, { ...itemBase, href: "/autre" }];
    expect(filterNavItems(items, ["benevole"])).toHaveLength(2);
  });

  it("exclut les items dont le role n'est pas present", () => {
    const items: NavItem[] = [
      itemBase,
      { ...itemBase, href: "/admin", roles: ["super_admin"] },
    ];
    expect(filterNavItems(items, ["benevole"])).toHaveLength(1);
  });

  it("inclut les items si le role correspond", () => {
    const items: NavItem[] = [
      { ...itemBase, roles: ["responsable", "super_admin"] },
    ];
    expect(filterNavItems(items, ["responsable"])).toHaveLength(1);
  });

  it("retourne une liste vide si aucun item ne correspond", () => {
    const items: NavItem[] = [
      { ...itemBase, roles: ["super_admin"] },
    ];
    expect(filterNavItems(items, ["benevole"])).toHaveLength(0);
  });
});

describe("isNavItemActive", () => {
  it("est actif sur le dashboard uniquement si chemin exact", () => {
    expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
    expect(isNavItemActive("/dashboard", "/dashboard/stats")).toBe(false);
  });

  it("est actif sur un chemin exact", () => {
    expect(isNavItemActive("/distributions", "/distributions")).toBe(true);
  });

  it("est actif pour les sous-chemins", () => {
    expect(isNavItemActive("/distributions", "/distributions/123")).toBe(true);
    expect(isNavItemActive("/distributions", "/distributions/123/pointage")).toBe(true);
  });

  it("n'est pas actif pour un chemin sans rapport", () => {
    expect(isNavItemActive("/distributions", "/mes-inscriptions")).toBe(false);
  });
});

describe("NAV_SECTIONS", () => {
  it("la premiere section contient les items principaux", () => {
    const firstSection = NAV_SECTIONS[0];
    expect(firstSection.items.length).toBeGreaterThan(0);
    // Certains items peuvent avoir des restrictions (ex: Mes missions pour les bénévoles)
  });

  // Le backend refuse au coordinateur GET /membres et PATCH /association.
  it("ne propose ni Membres ni Configuration au coordinateur", () => {
    const hrefs = NAV_SECTIONS.flatMap((s) => filterNavItems(s.items, ["coordinateur"])).map((i) => i.href);
    expect(hrefs).not.toContain("/association/membres");
    expect(hrefs).not.toContain("/association/configuration");
  });

  it("ne propose pas les missions de collecte au beneficiaire", () => {
    const hrefs = NAV_SECTIONS.flatMap((s) => filterNavItems(s.items, ["beneficiaire"])).map((i) => i.href);
    expect(hrefs).not.toContain("/missions-collecte");
    expect(hrefs).not.toContain("/mes-missions-collecte");
  });

  it("ne reference plus le role admin supprime", () => {
    NAV_SECTIONS.flatMap((s) => s.items).forEach((item) => {
      expect(item.roles ?? []).not.toContain("admin");
    });
  });

  it("la section Administration contient uniquement des items super_admin", () => {
    const adminSection = NAV_SECTIONS.find((s) => s.title === "Administration");
    expect(adminSection).toBeDefined();
    adminSection!.items.forEach((item) => {
      expect(item.roles).toContain("super_admin");
    });
  });
});
