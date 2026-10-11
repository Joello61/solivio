import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { FormulaireEvenement } from "@/components/evenement/FormulaireEvenement";
import type { EvenementResponse } from "@/types/evenement";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/api/config", () => ({ lireCleGoogleMaps: () => Promise.resolve("") }));
vi.mock("@vis.gl/react-google-maps", () => ({ APIProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/distributions/AdresseAutocomplete", () => ({ AdresseAutocomplete: () => null }));

const modifierEvenement = vi.fn().mockResolvedValue({ id: "e1" });
vi.mock("@/lib/api/evenement", () => ({
  creerEvenement: vi.fn(),
  modifierEvenement: (...args: unknown[]) => modifierEvenement(...args),
}));

const evenement: EvenementResponse = {
  id: "e1",
  titre: "Stand de rentrée",
  description: "Sur le campus",
  type: "STAND",
  lieuPlaceId: "p1",
  lieuAdresseFormatee: "Place du Capitole, Toulouse",
  lieuLatitude: 43.6,
  lieuLongitude: 1.44,
  dateHeureDebut: "2099-09-10T08:00:00Z",
  dateHeureFin: "2099-09-10T12:00:00Z",
  aBesoiNStaff: true,
  ouvertParticipants: false,
  publicParticipants: null,
  modeInscription: "OBLIGATOIRE",
  capaciteStaff: 6,
  capaciteParticipants: null,
  statut: "BROUILLON",
  raisonAnnulation: null,
  nbStaff: 0,
  nbParticipants: 0,
  dateCreation: "2099-09-01T10:00:00Z",
};

describe("FormulaireEvenement en modification", () => {
  it("reprend les valeurs et les renvoie au meme instant", async () => {
    render(<FormulaireEvenement evenement={evenement} />);

    expect(await screen.findByDisplayValue("Stand de rentrée")).toBeInTheDocument();
    // Libelle du type choisi, pas la valeur brute STAND.
    expect(screen.getByRole("combobox", { name: /Type/i })).toHaveTextContent("Stand");
    expect(screen.queryByText("STAND")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /suivant/i }));
    expect(screen.getByLabelText(/Nombre de staff/i)).toHaveValue(6);
    await userEvent.click(screen.getByRole("button", { name: /enregistrer les modifications/i }));

    await waitFor(() => expect(modifierEvenement).toHaveBeenCalledTimes(1));
    const [id, payload] = modifierEvenement.mock.calls[0];
    expect(id).toBe("e1");
    expect(payload).toMatchObject({
      titre: "Stand de rentrée",
      type: "STAND",
      dateHeureDebut: "2099-09-10T08:00:00.000Z",
      dateHeureFin: "2099-09-10T12:00:00.000Z",
      lieuAdresseFormatee: "Place du Capitole, Toulouse",
      capaciteStaff: 6,
    });
  });
});
