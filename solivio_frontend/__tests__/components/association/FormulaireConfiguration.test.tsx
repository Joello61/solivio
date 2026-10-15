import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormulaireConfiguration } from "@/components/association/FormulaireConfiguration";
import type { AssociationResponse } from "@/types/association";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/api/association", () => ({
  mettreAJourAssociation: vi.fn().mockResolvedValue({ nom: "Solidarite Paris" }),
}));

const associationMock: AssociationResponse = {
  id: "asso-1",
  nom: "Solidarite Paris",
  logoUrl: null,
  couleurPrimaire: "#16513F",
  couleurSecondaire: "#1E6B52",
  fuseauHoraire: "Europe/Paris",
  frequenceMaxParSemaine: null,
  contactEmail: "contact@sp.fr",
  contactTelephone: null,
  dateCreation: "2026-01-01T00:00:00Z",
};

describe("FormulaireConfiguration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche les champs avec les valeurs initiales", () => {
    render(<FormulaireConfiguration association={associationMock} />);
    const nomInput = screen.getByLabelText(/nom de l/i) as HTMLInputElement;
    expect(nomInput.value).toBe("Solidarite Paris");
  });

  it("affiche le champ email avec la valeur initiale", () => {
    render(<FormulaireConfiguration association={associationMock} />);
    const emailInput = screen.getByLabelText(/email de contact/i) as HTMLInputElement;
    expect(emailInput.value).toBe("contact@sp.fr");
  });

  it("active le bouton Enregistrer", () => {
    render(<FormulaireConfiguration association={associationMock} />);
    expect(screen.getByRole("button", { name: /enregistrer/i })).toBeEnabled();
  });

  it("affiche le message de succes apres soumission reussie", async () => {
    render(<FormulaireConfiguration association={associationMock} />);
    fireEvent.submit(screen.getByRole("button", { name: /enregistrer/i }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/configuration mise à jour/i)).toBeInTheDocument();
    });
  });

  it("affiche une erreur en cas d'echec API", async () => {
    const { mettreAJourAssociation } = await import("@/lib/api/association");
    vi.mocked(mettreAJourAssociation).mockRejectedValueOnce({ detail: "Acces refuse." });

    render(<FormulaireConfiguration association={associationMock} />);
    fireEvent.submit(screen.getByRole("button", { name: /enregistrer/i }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Acces refuse.")).toBeInTheDocument();
    });
  });

  it("ne propose ni couleurs ni fuseau horaire", () => {
    render(<FormulaireConfiguration association={associationMock} />);
    expect(screen.queryByLabelText(/couleur/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/fuseau/i)).not.toBeInTheDocument();
  });

  it("remet la frequence par defaut quand le champ est vide", async () => {
    const { mettreAJourAssociation } = await import("@/lib/api/association");
    render(<FormulaireConfiguration association={{ ...associationMock, frequenceMaxParSemaine: 2 }} />);
    fireEvent.change(screen.getByLabelText(/distributions par semaine/i), { target: { value: "" } });
    fireEvent.submit(screen.getByRole("button", { name: /enregistrer/i }).closest("form")!);
    await waitFor(() => expect(mettreAJourAssociation).toHaveBeenCalledWith(expect.objectContaining({ frequenceMaxParSemaine: 0 })));
  });
});
