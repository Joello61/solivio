import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FicheMembre } from "@/components/distributions/FicheMembre";
import type { DistributionResponse, InscriptionResponse } from "@/types/distribution";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/distributions/PlanDepliable", () => ({ PlanDepliable: () => null }));

const distribution = {
  id: "d1",
  titre: "Distribution",
  date: "2099-10-22",
  statut: "PUBLIEE",
  modeCreneau: "CRENEAU_UNIQUE",
  creneaux: [{ id: "c1", heureDebut: "18:00:00", heureFin: "19:00:00", capacite: 50, placesRestantes: 10, confirmes: null, enAttente: null }],
  lieu: { nom: "Local", adresseFormatee: "1 rue", latitude: null, longitude: null, placeId: null },
  description: null,
  motifAnnulation: null,
  capaciteBeneficiaires: 50,
  capaciteBenevoles: 10,
  remplissage: { placesRestantesBeneficiaires: 10, placesRestantesBenevoles: 3 },
} as unknown as DistributionResponse;

const inscriptionBenevole = {
  id: "i1",
  distributionId: "d1",
  creneauId: "c1",
  type: "BENEVOLE",
  statut: "CONFIRMEE",
  presence: "NON_POINTE",
  rangListeAttente: null,
  roles: [],
} as unknown as InscriptionResponse;

describe("FicheMembre", () => {
  it("ouvre les deux places a qui est benevole et beneficiaire (ADR-012)", () => {
    render(<FicheMembre distribution={distribution} mesInscriptions={[]} types={["BENEFICIAIRE", "BENEVOLE"]} />);

    expect(screen.getByRole("heading", { name: "Comme bénéficiaire" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comme bénévole" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Réserver ma place" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Je viens aider" })).toBeInTheDocument();
  });

  it("montre le billet du type deja pris et la reservation de l'autre", () => {
    render(
      <FicheMembre distribution={distribution} mesInscriptions={[inscriptionBenevole]} types={["BENEFICIAIRE", "BENEVOLE"]} />,
    );

    expect(screen.getByRole("button", { name: "Réserver ma place" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Je viens aider" })).not.toBeInTheDocument();
  });

  it("ne propose pas de pointage au membre", () => {
    render(<FicheMembre distribution={{ ...distribution, statut: "EN_COURS" }} mesInscriptions={[inscriptionBenevole]} types={["BENEVOLE"]} />);

    expect(screen.queryByRole("link", { name: /pointage/i })).not.toBeInTheDocument();
  });
});
