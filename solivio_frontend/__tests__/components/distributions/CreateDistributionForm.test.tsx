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
    render(<CreateDistributionForm distribution={distribution} aujourdhui="2099-03-01" />);

    expect(await screen.findByDisplayValue("Distribution du jeudi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

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
    render(<CreateDistributionForm aujourdhui="2099-03-01" />);
    await userEvent.type(await screen.findByLabelText(/^Date/), "2099-03-12");
    await userEvent.type(screen.getByLabelText(/^Bénéficiaires/), "20");

    await userEvent.click(screen.getByRole("button", { name: /Générer des créneaux/ }));
    await userEvent.clear(screen.getByLabelText("De"));
    await userEvent.type(screen.getByLabelText("De"), "10:00");
    await userEvent.clear(screen.getByLabelText("À"));
    await userEvent.type(screen.getByLabelText("À"), "11:00");
    await userEvent.clear(screen.getByLabelText("Places par créneau"));
    await userEvent.type(screen.getByLabelText("Places par créneau"), "5");
    await userEvent.click(screen.getByRole("button", { name: "30 min" }));
    expect(screen.getByRole("list", { name: "Créneaux qui seront créés" })).toHaveTextContent("10:0010:30");
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

describe("CreateDistributionForm, titre et duplication", () => {
  it("propose le titre a partir de la date tant qu'on ne l'a pas reecrit", async () => {
    render(<CreateDistributionForm aujourdhui="2099-03-01" />);
    await userEvent.type(await screen.findByLabelText(/^Date/), "2099-03-12");
    expect(screen.getByLabelText(/^Titre/)).toHaveValue("Distribution du jeudi 12 mars");

    await userEvent.clear(screen.getByLabelText(/^Titre/));
    await userEvent.type(screen.getByLabelText(/^Titre/), "Distribution de printemps");
    await userEvent.clear(screen.getByLabelText(/^Date/));
    await userEvent.type(screen.getByLabelText(/^Date/), "2099-03-19");
    expect(screen.getByLabelText(/^Titre/)).toHaveValue("Distribution de printemps");
  });

  it("duplique une semaine plus tard, avec de nouveaux creneaux", async () => {
    creerDistribution.mockClear();
    render(<CreateDistributionForm modele={distribution} aujourdhui="2099-03-13" />);

    expect(await screen.findByLabelText(/^Date/)).toHaveValue("2099-03-19");
    expect(screen.getByLabelText(/^Titre/)).toHaveValue("Distribution du jeudi 19 mars");
    await userEvent.click(screen.getByRole("button", { name: /Créer la distribution/ }));

    await waitFor(() => expect(creerDistribution).toHaveBeenCalledTimes(1));
    const payload = creerDistribution.mock.calls[0][0];
    expect(payload.date).toBe("2099-03-19");
    expect(payload.creneaux).toEqual([
      { heureDebut: "17:00", heureFin: "18:00", capacite: 15 },
      { heureDebut: "18:00", heureFin: "19:00", capacite: 15 },
    ]);
  });
});

describe("CreateDistributionForm, protections d'une distribution publiee", () => {
  it("explique qu'un creneau occupe ne se supprime pas et garde le mode decoupe", async () => {
    const occupee: DistributionResponse = {
      ...distribution,
      creneaux: [
        { ...distribution.creneaux[0], confirmes: 4, enAttente: 1 },
        distribution.creneaux[1],
        { id: "c3", heureDebut: "19:00:00", heureFin: "20:00:00", capacite: 15, placesRestantes: 15, confirmes: 0, enAttente: 0 },
      ],
      remplissage: { ...distribution.remplissage, beneficiairesConfirmes: 4 },
    };
    render(<CreateDistributionForm distribution={occupee} aujourdhui="2099-03-01" />);

    expect(await screen.findByText(/5 inscriptions sur ce créneau : il ne peut pas être supprimé, ni passer sous 4 places/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Supprimer le créneau 1" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Supprimer le créneau 3" })).toBeInTheDocument();
    expect(screen.getByText("Au moins 4 : déjà inscrits.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Générer des créneaux/ })).not.toBeInTheDocument();
  });

  it("ne laisse pas decouper une distribution publiee avec un seul creneau", async () => {
    render(
      <CreateDistributionForm
        distribution={{ ...distribution, modeCreneau: "CRENEAU_UNIQUE", creneaux: [distribution.creneaux[0]] }}
        aujourdhui="2099-03-01"
      />,
    );
    expect(await screen.findByText(/on ne peut plus la découper/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ajouter un créneau" })).not.toBeInTheDocument();
  });
});
