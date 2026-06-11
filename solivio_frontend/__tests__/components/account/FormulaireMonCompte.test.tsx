import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormulaireMonCompte } from "@/components/account/FormulaireMonCompte";
import type { MeResponse } from "@/types/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/api/profil", () => ({
  mettreAJourProfil: vi.fn(),
  uploadAvatar: vi.fn(),
}));

const user: MeResponse = {
  id: "user-1",
  email: "alice@example.com",
  nom: "Dupont",
  prenom: "Alice",
  telephone: "0600000000",
  photoUrl: null,
  superAdmin: false,
  tenantActif: "pilote",
  roles: ["benevole"],
  dateCreation: "2024-01-01T00:00:00Z",
  dateModification: "2024-01-01T00:00:00Z",
  emailVerifie: true,
  authMethod: "password",
};

describe("FormulaireMonCompte", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche les champs pre-remplis", () => {
    render(<FormulaireMonCompte user={user} />);
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dupont")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0600000000")).toBeInTheDocument();
  });

  it("affiche l'email en lecture seule", () => {
    render(<FormulaireMonCompte user={user} />);
    const emailInput = screen.getByDisplayValue("alice@example.com");
    expect(emailInput).toBeDisabled();
  });

  it("appelle mettreAJourProfil a la soumission", async () => {
    const { mettreAJourProfil } = await import("@/lib/api/profil");
    vi.mocked(mettreAJourProfil).mockResolvedValue({ ...user, nom: "Martin" });
    render(<FormulaireMonCompte user={user} />);

    fireEvent.change(screen.getByLabelText(/Nom/), { target: { value: "Martin" } });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Enregistrer" }).closest("form")!);
    });

    await waitFor(() => {
      expect(mettreAJourProfil).toHaveBeenCalledWith(
        expect.objectContaining({ nom: "Martin" })
      );
    });
  });

  it("affiche un message de succes apres sauvegarde", async () => {
    const { mettreAJourProfil } = await import("@/lib/api/profil");
    vi.mocked(mettreAJourProfil).mockResolvedValue(user);
    render(<FormulaireMonCompte user={user} />);

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Enregistrer" }).closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByText(/Profil mis a jour/)).toBeInTheDocument();
    });
  });

  it("affiche une erreur en cas d'echec", async () => {
    const { mettreAJourProfil } = await import("@/lib/api/profil");
    vi.mocked(mettreAJourProfil).mockRejectedValue(
      Object.assign(new Error("Erreur serveur"), { detail: "Erreur serveur" })
    );
    render(<FormulaireMonCompte user={user} />);

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Enregistrer" }).closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByText("Erreur serveur")).toBeInTheDocument();
    });
  });

  it("desactive le bouton pendant la soumission", async () => {
    const { mettreAJourProfil } = await import("@/lib/api/profil");
    vi.mocked(mettreAJourProfil).mockImplementation(() => new Promise(() => {}));
    render(<FormulaireMonCompte user={user} />);

    act(() => {
      fireEvent.submit(screen.getByRole("button", { name: "Enregistrer" }).closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Enregistrement..." })).toBeDisabled();
    });
  });

  it("affiche le bouton de changement de photo", () => {
    render(<FormulaireMonCompte user={user} />);
    expect(screen.getByRole("button", { name: "Changer la photo de profil" })).toBeInTheDocument();
  });
});
