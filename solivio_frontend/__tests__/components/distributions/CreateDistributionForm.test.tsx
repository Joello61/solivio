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
vi.mock("@/lib/api/distributions", () => ({
  creerDistribution: vi.fn(),
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
    { id: "c1", heureDebut: "17:00:00", heureFin: "18:00:00", capacite: 15 },
    { id: "c2", heureDebut: "18:00:00", heureFin: "19:00:00", capacite: 15 },
  ],
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
