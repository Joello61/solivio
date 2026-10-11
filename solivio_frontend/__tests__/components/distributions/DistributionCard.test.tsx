import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DistributionCard } from "@/components/distributions/DistributionCard";
import type { DistributionResponse } from "@/types/distribution";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/api/distributions", () => ({
  publierDistribution: vi.fn(),
  demarrerDistribution: vi.fn(),
  terminerDistribution: vi.fn(),
  annulerDistribution: vi.fn(),
}));

const distributionMock: DistributionResponse = {
  id: "abc-123",
  titre: "Distribution de test",
  description: null,
  lieu: { placeId: null, nom: "Salle B", adresseFormatee: "Salle B", latitude: null, longitude: null, numeroRue: null, voie: null, codePostal: null, ville: null },
  date: "2026-12-15",
  statut: "PUBLIEE",
  capaciteBeneficiaires: 50,
  capaciteBenevoles: 10,
  modeCreneau: "CRENEAU_UNIQUE",
  baseRepartition: "INSCRITS",
  motifAnnulation: null,
  dateCreation: "2026-06-01T10:00:00Z",
  creneaux: [],
};

describe("DistributionCard", () => {
  it("affiche le titre de la distribution", () => {
    render(<DistributionCard distribution={distributionMock} />);
    expect(screen.getByText("Distribution de test")).toBeInTheDocument();
  });

  it("affiche le lieu", () => {
    render(<DistributionCard distribution={distributionMock} />);
    expect(screen.getByText("Salle B")).toBeInTheDocument();
  });

  it("affiche les capacites", () => {
    render(<DistributionCard distribution={distributionMock} />);
    expect(screen.getByText(/50 bénéficiaires/)).toBeInTheDocument();
  });

  it("cree un lien vers la page de detail", () => {
    render(<DistributionCard distribution={distributionMock} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/distributions/abc-123");
  });

  it("affiche le badge de statut PUBLIEE", () => {
    render(<DistributionCard distribution={distributionMock} />);
    expect(screen.getByText("Publiée")).toBeInTheDocument();
  });

  // --- Vue gestionnaire ---

  it("affiche le bouton Demarrer pour une distribution PUBLIEE vue gestionnaire", () => {
    render(<DistributionCard distribution={distributionMock} estGestionnaire={true} />);
    expect(screen.getByRole("button", { name: /démarrer/i })).toBeInTheDocument();
  });

  it("affiche le bouton Annuler pour une distribution active vue gestionnaire", () => {
    render(<DistributionCard distribution={distributionMock} estGestionnaire={true} />);
    expect(screen.getByRole("button", { name: /annuler/i })).toBeInTheDocument();
  });

  it("n'affiche pas de boutons d'action pour une distribution TERMINEE", () => {
    const terminee = { ...distributionMock, statut: "TERMINEE" as const };
    render(<DistributionCard distribution={terminee} estGestionnaire={true} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("n'affiche pas de boutons d'action sans estGestionnaire", () => {
    render(<DistributionCard distribution={distributionMock} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
