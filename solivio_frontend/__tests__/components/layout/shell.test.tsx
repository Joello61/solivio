import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { MeResponse } from "@/types/auth";

let chemin = "/dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => chemin,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@/lib/auth", () => ({ logout: vi.fn().mockResolvedValue(undefined) }));

function membre(roles: string[]): MeResponse {
  return {
    id: "u1",
    email: "membre@example.com",
    nom: "Haddad",
    prenom: "Paul",
    roles,
  } as MeResponse;
}

describe("Sidebar", () => {
  beforeEach(() => {
    chemin = "/distributions/d1";
  });

  it("nomme les rubriques selon le role et marque la rubrique courante", () => {
    render(<Sidebar user={membre(["coordinateur"])} />);
    const nav = screen.getByRole("navigation", { name: "Navigation principale" });
    expect(within(nav).getByRole("link", { name: "Planning" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Aujourd'hui" })).not.toHaveAttribute("aria-current");
    expect(within(nav).queryByRole("link", { name: "Membres" })).toBeNull();
  });

  it("affiche le compte une seule fois, avec la deconnexion", () => {
    render(<Sidebar user={membre(["beneficiaire"])} />);
    expect(screen.getAllByText("Paul Haddad")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
  });

  it("propose le jour J quand une distribution a lieu aujourd'hui", () => {
    render(<Sidebar user={membre(["coordinateur"])} jourJ="/distributions/d1/pointage" />);
    expect(screen.getByRole("link", { name: "Jour J" })).toHaveAttribute("href", "/distributions/d1/pointage");
  });
});

describe("TopBar", () => {
  it("affiche l'association sur l'accueil", () => {
    chemin = "/dashboard";
    render(<TopBar user={membre(["beneficiaire"])} />);
    expect(screen.getByText("Linkee Toulouse")).toBeInTheDocument();
  });

  it("propose le retour vers la rubrique depuis une page de detail", () => {
    chemin = "/distributions/d1";
    render(<TopBar user={membre(["beneficiaire"])} />);
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute("href", "/distributions");
  });
});

describe("BottomNav", () => {
  it("offre trois rubriques et le menu complet", () => {
    chemin = "/mes-inscriptions";
    render(<BottomNav user={membre(["beneficiaire"])} />);
    const nav = screen.getByRole("navigation", { name: "Navigation mobile" });
    expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual(["Accueil", "Agenda", "Inscriptions"]);
    expect(within(nav).getByRole("link", { name: "Inscriptions" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });
});
