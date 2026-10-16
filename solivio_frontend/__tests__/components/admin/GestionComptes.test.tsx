import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GestionComptes } from "@/components/admin/GestionComptes";
import * as api from "@/lib/api/profil";
import type { CompteAdminResponse, PageResponse } from "@/types/profil";

const routeur = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routeur, usePathname: () => "/admin/utilisateurs" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/lib/api/profil", () => ({
  changerStatutCompte: vi.fn().mockResolvedValue({}),
  changerSuperAdmin: vi.fn().mockResolvedValue({}),
  supprimerCompteAdmin: vi.fn().mockResolvedValue(undefined),
  effacerDonneesCompteAdmin: vi.fn().mockResolvedValue(undefined),
}));

const compte = (id: string, prenom: string, nom: string, extra: Partial<CompteAdminResponse> = {}): CompteAdminResponse => ({
  id,
  email: `${prenom.toLowerCase()}@example.com`,
  nom,
  prenom,
  photoUrl: null,
  emailVerifie: true,
  actif: true,
  superAdmin: false,
  dateCreation: "2026-01-01T00:00:00Z",
  roles: ["benevole"],
  statutMembre: "actif",
  ...extra,
});

const page = (content: CompteAdminResponse[], totalPages = 1, number = 0): PageResponse<CompteAdminResponse> => ({
  content,
  totalElements: content.length,
  totalPages,
  number,
  size: 20,
});

const comptes = [compte("c1", "Alice", "Dupont"), compte("c2", "Bob", "Martin", { actif: false }), compte("c3", "Chloé", "Petit", { superAdmin: true })];
const table = () => screen.getAllByRole("table")[0];
const ouvrir = (nom: string) => userEvent.click(within(table()).getByRole("button", { name: `Gérer ${nom}` }));

describe("GestionComptes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filtre les comptes desactives et les super admins", async () => {
    render(<GestionComptes page={page(comptes)} currentUserId="autre" recherche="" currentPage={0} />);
    expect(within(table()).getByText("Dupont Alice")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Désactivés" }));
    expect(within(table()).getByText("Martin Bob")).toBeInTheDocument();
    expect(within(table()).queryByText("Dupont Alice")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Super admins" }));
    expect(within(table()).getByText("Petit Chloé")).toBeInTheDocument();
  });

  it("cherche cote serveur par l'adresse", async () => {
    render(<GestionComptes page={page(comptes)} currentUserId="autre" recherche="" currentPage={0} />);
    await userEvent.type(screen.getByLabelText("Chercher un compte"), "alice");
    await userEvent.click(screen.getByRole("button", { name: "Chercher" }));
    expect(routeur.push).toHaveBeenCalledWith("/admin/utilisateurs?q=alice");
  });

  it("desactive un compte apres confirmation", async () => {
    render(<GestionComptes page={page(comptes)} currentUserId="autre" recherche="" currentPage={0} />);
    await ouvrir("Alice Dupont");
    await userEvent.click(screen.getByRole("button", { name: "Désactiver le compte" }));
    expect(api.changerStatutCompte).not.toHaveBeenCalled();
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Désactiver" }));
    expect(api.changerStatutCompte).toHaveBeenCalledWith("c1", false);
  });

  it("efface les donnees d'un compte (RGPD) apres confirmation", async () => {
    render(<GestionComptes page={page(comptes)} currentUserId="autre" recherche="" currentPage={0} />);
    await ouvrir("Alice Dupont");
    await userEvent.click(screen.getByRole("button", { name: "Effacer les données personnelles" }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Effacer définitivement" }));
    expect(api.effacerDonneesCompteAdmin).toHaveBeenCalledWith("c1");
  });

  it("ne propose aucune action sur son propre compte", async () => {
    render(<GestionComptes page={page(comptes)} currentUserId="c1" recherche="" currentPage={0} />);
    await ouvrir("Alice Dupont");
    const fiche = screen.getByRole("dialog");
    expect(within(fiche).getByText(/aucune action possible/)).toBeInTheDocument();
    expect(within(fiche).queryByRole("button", { name: /Désactiver|Supprimer|Effacer/ })).not.toBeInTheDocument();
  });

  it("pagine en gardant la recherche", async () => {
    render(<GestionComptes page={page(comptes, 3, 1)} currentUserId="autre" recherche="dupont" currentPage={1} />);
    expect(screen.getByText("Page 2 sur 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Suivante" }));
    expect(routeur.push).toHaveBeenCalledWith("/admin/utilisateurs?q=dupont&page=2");
  });

  it("annonce une liste vide", () => {
    render(<GestionComptes page={page([])} currentUserId="autre" recherche="" currentPage={0} />);
    expect(screen.getByText("Aucun compte trouvé")).toBeInTheDocument();
  });
});
