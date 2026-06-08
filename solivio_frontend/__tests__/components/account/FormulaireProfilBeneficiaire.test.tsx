import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormulaireProfilBeneficiaire } from "@/components/account/FormulaireProfilBeneficiaire";
import type { ProfilBeneficiaireResponse } from "@/types/profil";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/api/profil", () => ({
  mettreAJourProfilBeneficiaire: vi.fn(),
}));

const profilVide: ProfilBeneficiaireResponse = {
  dateNaissance: null,
  statutBoursier: null,
  echelonBourse: null,
  categorieNationalite: null,
  resteAVivreMensuel: null,
  niveauAcademique: null,
  etablissement: null,
  situationLogement: null,
  aEmploiEtudiant: null,
  complet: false,
};

const profilComplet: ProfilBeneficiaireResponse = {
  dateNaissance: "2000-01-15",
  statutBoursier: "boursier",
  echelonBourse: 3,
  categorieNationalite: "francaise",
  resteAVivreMensuel: 350,
  niveauAcademique: "L3",
  etablissement: "Universite Paris",
  situationLogement: "colocation",
  aEmploiEtudiant: false,
  complet: true,
};

describe("FormulaireProfilBeneficiaire", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le badge Incomplet quand le profil est vide", () => {
    render(<FormulaireProfilBeneficiaire profil={profilVide} />);
    expect(screen.getByText("Incomplet")).toBeInTheDocument();
  });

  it("affiche le badge Complet quand le profil est complet", () => {
    render(<FormulaireProfilBeneficiaire profil={profilComplet} />);
    expect(screen.getByText("Complet")).toBeInTheDocument();
  });

  it("affiche l'alerte d'invitation a completer quand profil incomplet", () => {
    render(<FormulaireProfilBeneficiaire profil={profilVide} />);
    expect(screen.getByText(/Completez votre dossier/)).toBeInTheDocument();
  });

  it("pre-remplit les champs depuis le profil existant", () => {
    render(<FormulaireProfilBeneficiaire profil={profilComplet} />);
    expect(screen.getByDisplayValue("2000-01-15")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Universite Paris")).toBeInTheDocument();
  });

  it("affiche le champ echelon uniquement si boursier", () => {
    render(<FormulaireProfilBeneficiaire profil={profilVide} />);
    expect(screen.queryByLabelText(/Echelon/)).not.toBeInTheDocument();
  });

  it("affiche l'echelon si statut boursier = boursier", () => {
    render(<FormulaireProfilBeneficiaire profil={{ ...profilVide, statutBoursier: "boursier" }} />);
    expect(screen.getByLabelText(/Echelon/)).toBeInTheDocument();
  });

  it("appelle mettreAJourProfilBeneficiaire a la soumission", async () => {
    const { mettreAJourProfilBeneficiaire } = await import("@/lib/api/profil");
    vi.mocked(mettreAJourProfilBeneficiaire).mockResolvedValue({ ...profilComplet });
    render(<FormulaireProfilBeneficiaire profil={profilComplet} />);

    await act(async () => {
      fireEvent.submit(
        screen.getByRole("button", { name: "Enregistrer le dossier" }).closest("form")!
      );
    });

    await waitFor(() => {
      expect(mettreAJourProfilBeneficiaire).toHaveBeenCalled();
    });
  });

  it("affiche un message de succes apres sauvegarde", async () => {
    const { mettreAJourProfilBeneficiaire } = await import("@/lib/api/profil");
    vi.mocked(mettreAJourProfilBeneficiaire).mockResolvedValue(profilComplet);
    render(<FormulaireProfilBeneficiaire profil={profilComplet} />);

    await act(async () => {
      fireEvent.submit(
        screen.getByRole("button", { name: "Enregistrer le dossier" }).closest("form")!
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Dossier mis a jour/)).toBeInTheDocument();
    });
  });

  it("affiche une erreur en cas d'echec", async () => {
    const { mettreAJourProfilBeneficiaire } = await import("@/lib/api/profil");
    vi.mocked(mettreAJourProfilBeneficiaire).mockRejectedValue(
      Object.assign(new Error("Erreur API"), { detail: "Erreur API" })
    );
    render(<FormulaireProfilBeneficiaire profil={profilVide} />);

    await act(async () => {
      fireEvent.submit(
        screen.getByRole("button", { name: "Enregistrer le dossier" }).closest("form")!
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Erreur API")).toBeInTheDocument();
    });
  });
});
