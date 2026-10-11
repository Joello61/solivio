import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DistributionStatutBadge } from "@/components/distributions/DistributionStatutBadge";

describe("DistributionStatutBadge", () => {
  it("affiche 'Brouillon' pour le statut BROUILLON", () => {
    render(<DistributionStatutBadge statut="BROUILLON" />);
    expect(screen.getByText("Brouillon")).toBeInTheDocument();
  });

  it("affiche 'Publiee' pour le statut PUBLIEE", () => {
    render(<DistributionStatutBadge statut="PUBLIEE" />);
    expect(screen.getByText("Publiée")).toBeInTheDocument();
  });

  it("affiche 'En cours' pour le statut EN_COURS", () => {
    render(<DistributionStatutBadge statut="EN_COURS" />);
    expect(screen.getByText("En cours")).toBeInTheDocument();
  });

  it("affiche 'Terminee' pour le statut TERMINEE", () => {
    render(<DistributionStatutBadge statut="TERMINEE" />);
    expect(screen.getByText("Terminée")).toBeInTheDocument();
  });

  it("affiche 'Annulee' pour le statut ANNULEE", () => {
    render(<DistributionStatutBadge statut="ANNULEE" />);
    expect(screen.getByText("Annulée")).toBeInTheDocument();
  });
});
