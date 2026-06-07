import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DistributionCard } from "@/components/distributions/DistributionCard";
import type { DistributionResponse } from "@/types/distribution";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const distributionMock: DistributionResponse = {
  id: "abc-123",
  titre: "Distribution de test",
  description: null,
  lieu: "Salle B",
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
    expect(screen.getByText(/50 beneficiaires/)).toBeInTheDocument();
  });

  it("cree un lien vers la page de detail", () => {
    render(<DistributionCard distribution={distributionMock} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/distributions/abc-123");
  });

  it("affiche le badge de statut PUBLIEE", () => {
    render(<DistributionCard distribution={distributionMock} />);
    expect(screen.getByText("Publiee")).toBeInTheDocument();
  });
});
