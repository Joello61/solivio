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
  role: "benevole",
  statutMembre: "actif",
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

  // Le backend refuse toute action sur son propre compte (409).
  it("ne propose aucune action sur son propre compte", () => {
    render(<GestionComptes page={pageUnSeulCompte} currentUserId="compte-1" recherche="" currentPage={0} />);
    expect(screen.queryByRole("button", { name: /Désactiver/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Supprimer/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("(vous)")[0]).toBeInTheDocument();
  });

  it("affiche le message vide si aucun compte", () => {
    render(<GestionComptes page={pageVide} currentUserId="moi" recherche="" currentPage={0} />);
    expect(screen.getByText(/Aucun compte trouvé/)).toBeInTheDocument();
  });

  it("affiche la liste des comptes", () => {
    render(<GestionComptes page={pageUnSeulCompte} currentUserId="moi" recherche="" currentPage={0} />);
    // Nom et email apparaissent dans la vue mobile et la vue desktop
    expect(screen.getAllByText("Alice Dupont")[0]).toBeInTheDocument();
    expect(screen.getAllByText("alice@example.com")[0]).toBeInTheDocument();
  });

  it("affiche le role du membre", () => {
    render(<GestionComptes page={pageUnSeulCompte} currentUserId="moi" recherche="" currentPage={0} />);
    expect(screen.getAllByText("Bénévole")[0]).toBeInTheDocument();
  });

  it("signale un membre suspendu", () => {
    const suspendu = { ...compteActif, statutMembre: "suspendu" };
    render(<GestionComptes page={{ ...pageUnSeulCompte, content: [suspendu] }} currentUserId="moi" recherche="" currentPage={0} />);
    expect(screen.getAllByText("Bénévole (suspendu)")[0]).toBeInTheDocument();
  });

  it("affiche le badge Actif pour un compte actif", () => {
    render(<GestionComptes page={pageUnSeulCompte} currentUserId="moi" recherche="" currentPage={0} />);
    expect(screen.getAllByText("Actif")[0]).toBeInTheDocument();
  });

  it("affiche le badge Super admin si applicable", () => {
    const pageSuperAdmin: PageResponse<CompteAdminResponse> = {
      ...pageUnSeulCompte,
      content: [{ ...compteActif, superAdmin: true }],
    };
    render(<GestionComptes page={pageSuperAdmin} currentUserId="moi" recherche="" currentPage={0} />);
    expect(screen.getAllByText("Super admin")[0]).toBeInTheDocument();
  });

  it("affiche le champ de recherche pre-rempli", () => {
    render(<GestionComptes page={pageUnSeulCompte} currentUserId="moi" recherche="alice" currentPage={0} />);
    expect(screen.getByDisplayValue("alice")).toBeInTheDocument();
  });

  it("n'affiche pas la pagination si une seule page", () => {
    render(<GestionComptes page={pageUnSeulCompte} currentUserId="moi" recherche="" currentPage={0} />);
    expect(screen.queryByRole("button", { name: /Précédent/ })).not.toBeInTheDocument();
  });

  it("affiche la pagination si plusieurs pages", () => {
    const pagePlusieurs: PageResponse<CompteAdminResponse> = {
      ...pageUnSeulCompte,
      totalPages: 3,
      totalElements: 60,
    };
    render(<GestionComptes page={pagePlusieurs} currentUserId="moi" recherche="" currentPage={1} />);
    expect(screen.getByRole("button", { name: "Précédent" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suivant" })).toBeInTheDocument();
    expect(screen.getByText("Page 2 / 3")).toBeInTheDocument();
  });

  it("appelle changerStatutCompte lors du clic Desactiver", async () => {
    const { changerStatutCompte } = await import("@/lib/api/profil");
    render(<GestionComptes page={pageUnSeulCompte} currentUserId="moi" recherche="" currentPage={0} />);

    // Ouvre le dialog via le premier bouton Desactiver (vue mobile)
    fireEvent.click(screen.getAllByRole("button", { name: /Désactiver/i })[0]);

    // Attend l'affichage du dialog et confirme l'action
    await waitFor(() => {
      expect(screen.getByText("Désactiver le compte")).toBeInTheDocument();
    });
    const boutons = screen.getAllByRole("button", { name: /Désactiver/i });
    fireEvent.click(boutons[boutons.length - 1]);

    await waitFor(() => {
      expect(changerStatutCompte).toHaveBeenCalledWith("compte-1", false);
    });
  });
});
