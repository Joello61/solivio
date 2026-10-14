import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { CreateDistributionForm } from "@/components/distributions/CreateDistributionForm";
import type { DistributionResponse } from "@/types/distribution";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/api/config", () => ({ lireCleGoogleMaps: () => Promise.resolve("") }));
vi.mock("@vis.gl/react-google-maps", () => ({ APIProvider: ({ children }: { children: ReactNode }) => children }));
vi.mock("@/components/distributions/AdresseAutocomplete", () => ({ AdresseAutocomplete: () => null }));

const modifierDistribution = vi.fn().mockResolvedValue({ id: "d1" });
const creerDistribution = vi.fn().mockResolvedValue({ id: "d2" });
vi.mock("@/lib/api/distributions", () => ({
  creerDistribution: (...args: unknown[]) => creerDistribution(...args),
  modifierDistribution: (...args: unknown[]) => modifierDistribution(...args),
}));

const distribution: DistributionResponse = {
  id: "d1",
  titre: "Distribution du jeudi",
  description: null,
  lieu: null,
  date: "2099-03-12",
  statut: "PUBLIEE",
  capaciteBeneficiaires: 30,
  capaciteBenevoles: null,
  modeCreneau: "CRENEAUX_DECOUPES",
  baseRepartition: "INSCRITS",
  motifAnnulation: null,
  dateCreation: "2099-03-01T10:00:00Z",
  creneaux: [
    { id: "c1", heureDebut: "17:00:00", heureFin: "18:00:00", capacite: 15, placesRestantes: 15, confirmes: 0, enAttente: 0 },
    { id: "c2", heureDebut: "18:00:00", heureFin: "19:00:00", capacite: 15, placesRestantes: 15, confirmes: 0, enAttente: 0 },
  ],
  remplissage: {
    placesRestantesBeneficiaires: 30,
    placesRestantesBenevoles: null,
    beneficiairesConfirmes: 0,
    beneficiairesEnAttente: 0,
    benevolesConfirmes: 0,
    benevolesEnAttente: 0,
  },
};

describe("CreateDistributionForm en modification", () => {
  it("reprend les valeurs et envoie les creneaux avec leur identifiant", async () => {
    render(<CreateDistributionForm distribution={distribution} />);

    expect(await screen.findByDisplayValue("Distribution du jeudi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /suivant/i }));
    await userEvent.click(screen.getByRole("button", { name: /enregistrer les modifications/i }));

    await waitFor(() => expect(modifierDistribution).toHaveBeenCalledTimes(1));
    const [id, payload] = modifierDistribution.mock.calls[0];
    expect(id).toBe("d1");
    expect(payload.modeCreneau).toBe("CRENEAUX_DECOUPES");
    expect(payload.capaciteBenevoles).toBeUndefined();
    expect(payload.creneaux).toEqual([
      { id: "c1", heureDebut: "17:00", heureFin: "18:00", capacite: 15 },
      { id: "c2", heureDebut: "18:00", heureFin: "19:00", capacite: 15 },
    ]);
  });
});

describe("CreateDistributionForm, generateur de creneaux", () => {
  it("remplace les creneaux par des creneaux reguliers et passe en mode decoupe", async () => {
    render(<CreateDistributionForm />);
    await userEvent.type(await screen.findByLabelText(/^Titre/), "Distribution test");
    await userEvent.type(screen.getByLabelText(/^Date/), "2099-03-12");
    await userEvent.type(screen.getByLabelText(/^Bénéficiaires/), "20");
    await userEvent.click(screen.getByRole("button", { name: /suivant/i }));

    await userEvent.click(screen.getByRole("button", { name: /Générer des créneaux/ }));
    await userEvent.clear(screen.getByLabelText("À"));
    await userEvent.type(screen.getByLabelText("À"), "11:00");
    await userEvent.click(screen.getByRole("button", { name: "30 minutes" }));
    await userEvent.click(screen.getByRole("button", { name: "Générer" }));
    await userEvent.click(screen.getByRole("button", { name: /Créer la distribution/ }));

    await waitFor(() => expect(creerDistribution).toHaveBeenCalledTimes(1));
    const payload = creerDistribution.mock.calls[0][0];
    expect(payload.modeCreneau).toBe("CRENEAUX_DECOUPES");
    expect(payload.creneaux).toEqual([
      { heureDebut: "10:00", heureFin: "10:30", capacite: 5 },
      { heureDebut: "10:30", heureFin: "11:00", capacite: 5 },
    ]);
  });
});
