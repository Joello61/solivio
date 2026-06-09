import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DistributionActions } from "@/components/distributions/DistributionActions";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/lib/api/distributions", () => ({
  publierDistribution: vi.fn().mockResolvedValue({}),
  demarrerDistribution: vi.fn().mockResolvedValue({}),
  terminerDistribution: vi.fn().mockResolvedValue({}),
  annulerDistribution: vi.fn().mockResolvedValue({}),
}));

// Date clairement dans le futur (2099) et dans le passe (2020)
const DATE_FUTURE = "2099-01-01";
const DATE_PASSEE = "2020-01-01";
const DATE_AUJOURD_HUI = new Date().toISOString().split("T")[0];

describe("DistributionActions - garde temporelle sur Demarrer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("desactive le bouton Demarrer si la date est dans le futur", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_FUTURE}
      />,
    );
    expect(screen.getByRole("button", { name: /demarrer/i })).toBeDisabled();
  });

  it("affiche le message d'information quand le demarrage est bloque", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_FUTURE}
      />,
    );
    expect(screen.getByText(/demarrage sera possible le/i)).toBeInTheDocument();
  });

  it("active le bouton Demarrer si la date est passee", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_PASSEE}
      />,
    );
    expect(screen.getByRole("button", { name: /demarrer/i })).not.toBeDisabled();
  });

  it("active le bouton Demarrer si la date est aujourd'hui", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_AUJOURD_HUI}
      />,
    );
    expect(screen.getByRole("button", { name: /demarrer/i })).not.toBeDisabled();
  });

  it("n'affiche pas le message d'information quand le demarrage est possible", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_PASSEE}
      />,
    );
    expect(screen.queryByText(/demarrage sera possible le/i)).not.toBeInTheDocument();
  });

  it("appelle demarrerDistribution et rafraichit apres clic", async () => {
    const { demarrerDistribution } = await import("@/lib/api/distributions");
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_PASSEE}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /demarrer/i }));
    expect(demarrerDistribution).toHaveBeenCalledWith("id-1");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("affiche le bouton Terminer pour une distribution EN_COURS (pas de garde de date)", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="EN_COURS"
        distributionDate={DATE_FUTURE}
      />,
    );
    expect(screen.getByRole("button", { name: /terminer/i })).not.toBeDisabled();
  });

  it("affiche le bouton Annuler pour statut PUBLIEE meme si date future", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_FUTURE}
      />,
    );
    expect(screen.getByRole("button", { name: /annuler/i })).not.toBeDisabled();
  });
});
