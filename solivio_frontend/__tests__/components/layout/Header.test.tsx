import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Header } from "@/components/layout/Header";
import type { MeResponse } from "@/types/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/auth", () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

const userBase: MeResponse = {
  id: "user-1",
  email: "alice@example.com",
  nom: "Dupont",
  prenom: "Alice",
  telephone: null,
  photoUrl: null,
  superAdmin: false,
  tenantActif: "pilote",
  roles: ["benevole"],
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le nom de l'utilisateur", () => {
    render(<Header user={userBase} />);
    expect(screen.getByText("Alice Dupont")).toBeInTheDocument();
  });

  it("affiche le tenant actif", () => {
    render(<Header user={userBase} />);
    expect(screen.getByText("pilote")).toBeInTheDocument();
  });

  it("affiche le lien Mon compte apres ouverture du menu", () => {
    render(<Header user={userBase} />);
    fireEvent.click(screen.getByRole("button", { name: /Alice Dupont/i }));
    expect(screen.getByRole("link", { name: /Mon compte/ })).toHaveAttribute("href", "/mon-compte");
  });

  it("n'affiche pas le lien Utilisateurs si pas super admin", () => {
    render(<Header user={userBase} />);
    fireEvent.click(screen.getByRole("button", { name: /Alice Dupont/i }));
    expect(screen.queryByRole("link", { name: /Utilisateurs/ })).not.toBeInTheDocument();
  });

  it("affiche le lien Utilisateurs si super admin", () => {
    render(<Header user={{ ...userBase, superAdmin: true }} />);
    fireEvent.click(screen.getByRole("button", { name: /Alice Dupont/i }));
    expect(screen.getByRole("link", { name: /Utilisateurs/ })).toHaveAttribute(
      "href",
      "/admin/utilisateurs"
    );
  });

  it("affiche une icone User par defaut sans photo", () => {
    render(<Header user={userBase} />);
    // L'icone User est dans le bouton du header - pas d'image
    expect(screen.queryByRole("img", { name: "Avatar" })).not.toBeInTheDocument();
  });

  it("affiche l'image si photoUrl est defini", () => {
    render(<Header user={{ ...userBase, photoUrl: "/api/public/avatar/user-1" }} />);
    expect(screen.getByRole("img", { name: "Avatar" })).toBeInTheDocument();
  });

  it("affiche le bouton Se deconnecter apres ouverture du menu", () => {
    render(<Header user={userBase} />);
    fireEvent.click(screen.getByRole("button", { name: /Alice Dupont/i }));
    expect(screen.getByRole("button", { name: "Se deconnecter" })).toBeInTheDocument();
  });
});
