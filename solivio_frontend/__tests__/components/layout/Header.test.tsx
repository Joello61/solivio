import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Header } from "@/components/layout/Header";
import type { MeResponse } from "@/types/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
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
  roles: ["benevole"],
  dateCreation: "2024-01-01T00:00:00Z",
  dateModification: "2024-01-01T00:00:00Z",
  emailVerifie: true,
  authMethod: "password",
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le nom de l'utilisateur", () => {
    render(<Header user={userBase} />);
    expect(screen.getByText("Alice Dupont")).toBeInTheDocument();
  });

  it("affiche les initiales de l'utilisateur si pas de photo", () => {
    render(<Header user={userBase} />);
    expect(screen.getByText("AD")).toBeInTheDocument();
    // Pas d'image d'avatar (le logo /logo.svg est present mais avec alt="Solivio")
    expect(screen.queryByRole("img", { name: "Alice Dupont" })).not.toBeInTheDocument();
  });

  it("affiche l'image si photoUrl est defini", () => {
    render(<Header user={{ ...userBase, photoUrl: "/api/public/avatar/user-1" }} />);
    expect(screen.getByRole("img", { name: "Alice Dupont" })).toBeInTheDocument();
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
      "/admin/utilisateurs",
    );
  });

  it("affiche le bouton Se deconnecter apres ouverture du menu", () => {
    render(<Header user={userBase} />);
    fireEvent.click(screen.getByRole("button", { name: /Alice Dupont/i }));
    expect(screen.getByRole("button", { name: "Se deconnecter" })).toBeInTheDocument();
  });

  it("ferme le menu en recliquant sur le declencheur", () => {
    render(<Header user={userBase} />);
    const trigger = screen.getByRole("button", { name: /Alice Dupont/i });
    fireEvent.click(trigger);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText("alice@example.com")).not.toBeInTheDocument();
  });

  it("affiche le logo Solivio visible sur mobile", () => {
    render(<Header user={userBase} />);
    expect(screen.getByRole("link", { name: /Solivio/i })).toBeInTheDocument();
  });
});
