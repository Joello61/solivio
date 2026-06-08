import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GestionComptes } from "@/components/admin/GestionComptes";
import type { CompteAdminResponse, PageResponse } from "@/types/profil";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/api/profil", () => ({
  changerStatutCompte: vi.fn().mockResolvedValue({}),
  changerSuperAdmin: vi.fn().mockResolvedValue({}),
  supprimerCompteAdmin: vi.fn().mockResolvedValue(undefined),
}));

const compteActif: CompteAdminResponse = {
  id: "compte-1",
  email: "alice@example.com",
  nom: "Dupont",
  prenom: "Alice",
  photoUrl: null,
  emailVerifie: true,
  actif: true,
  superAdmin: false,
  dateCreation: "2026-01-01T00:00:00Z",
  affiliations: [{ associationNom: "Pilote", associationSlug: "pilote", role: "benevole", statut: "actif" }],
};

const pageUnSeulCompte: PageResponse<CompteAdminResponse> = {
  content: [compteActif],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 20,
};

const pageVide: PageResponse<CompteAdminResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 20,
};

describe("GestionComptes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le message vide si aucun compte", () => {
    render(<GestionComptes page={pageVide} recherche="" currentPage={0} />);
    expect(screen.getByText(/Aucun compte trouve/)).toBeInTheDocument();
  });

  it("affiche la liste des comptes", () => {
    render(<GestionComptes page={pageUnSeulCompte} recherche="" currentPage={0} />);
    expect(screen.getByText("Alice Dupont")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("affiche les associations du compte", () => {
    render(<GestionComptes page={pageUnSeulCompte} recherche="" currentPage={0} />);
    expect(screen.getByText("Pilote")).toBeInTheDocument();
  });

  it("affiche le badge Actif pour un compte actif", () => {
    render(<GestionComptes page={pageUnSeulCompte} recherche="" currentPage={0} />);
    expect(screen.getByText("Actif")).toBeInTheDocument();
  });

  it("affiche le badge Super admin si applicable", () => {
    const pageSuperAdmin: PageResponse<CompteAdminResponse> = {
      ...pageUnSeulCompte,
      content: [{ ...compteActif, superAdmin: true }],
    };
    render(<GestionComptes page={pageSuperAdmin} recherche="" currentPage={0} />);
    expect(screen.getByText("Super admin")).toBeInTheDocument();
  });

  it("affiche le champ de recherche pre-rempli", () => {
    render(<GestionComptes page={pageUnSeulCompte} recherche="alice" currentPage={0} />);
    expect(screen.getByDisplayValue("alice")).toBeInTheDocument();
  });

  it("n'affiche pas la pagination si une seule page", () => {
    render(<GestionComptes page={pageUnSeulCompte} recherche="" currentPage={0} />);
    expect(screen.queryByRole("button", { name: /Precedent/ })).not.toBeInTheDocument();
  });

  it("affiche la pagination si plusieurs pages", () => {
    const pagePlusieurs: PageResponse<CompteAdminResponse> = {
      ...pageUnSeulCompte,
      totalPages: 3,
      totalElements: 60,
    };
    render(<GestionComptes page={pagePlusieurs} recherche="" currentPage={1} />);
    expect(screen.getByRole("button", { name: "Precedent" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suivant" })).toBeInTheDocument();
    expect(screen.getByText("Page 2 / 3")).toBeInTheDocument();
  });

  it("appelle changerStatutCompte lors du clic Desactiver", async () => {
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    const { changerStatutCompte } = await import("@/lib/api/profil");
    render(<GestionComptes page={pageUnSeulCompte} recherche="" currentPage={0} />);

    fireEvent.click(screen.getByRole("button", { name: "Desactiver" }));

    await waitFor(() => {
      expect(changerStatutCompte).toHaveBeenCalledWith("compte-1", false);
    });
  });
});
