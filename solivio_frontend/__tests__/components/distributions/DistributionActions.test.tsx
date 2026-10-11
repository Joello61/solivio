import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DistributionActions } from "@/components/distributions/DistributionActions";

const mockRefresh = vi.fn();
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: mockPush }),
}));

vi.mock("@/lib/api/distributions", () => ({
  publierDistribution: vi.fn().mockResolvedValue({}),
  demarrerDistribution: vi.fn().mockResolvedValue({}),
  terminerDistribution: vi.fn().mockResolvedValue({}),
  annulerDistribution: vi.fn().mockResolvedValue({}),
  supprimerDistribution: vi.fn().mockResolvedValue(undefined),
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
    expect(screen.getByRole("button", { name: /démarrer/i })).toBeDisabled();
  });

  it("affiche le message d'information quand le demarrage est bloque", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_FUTURE}
      />,
    );
    expect(screen.getByText(/démarrage sera possible le/i)).toBeInTheDocument();
  });

  it("active le bouton Demarrer si la date est passee", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_PASSEE}
      />,
    );
    expect(screen.getByRole("button", { name: /démarrer/i })).not.toBeDisabled();
  });

  it("active le bouton Demarrer si la date est aujourd'hui", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_AUJOURD_HUI}
      />,
    );
    expect(screen.getByRole("button", { name: /démarrer/i })).not.toBeDisabled();
  });

  it("n'affiche pas le message d'information quand le demarrage est possible", () => {
    render(
      <DistributionActions
        distributionId="id-1"
        statut="PUBLIEE"
        distributionDate={DATE_PASSEE}
      />,
    );
    expect(screen.queryByText(/démarrage sera possible le/i)).not.toBeInTheDocument();
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
    await userEvent.click(screen.getByRole("button", { name: /démarrer/i }));
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

describe("DistributionActions - modification et suppression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propose de modifier une distribution publiee, pas de la supprimer", () => {
    render(<DistributionActions distributionId="id-1" statut="PUBLIEE" distributionDate={DATE_FUTURE} />);
    expect(screen.getByRole("link", { name: /modifier/i })).toHaveAttribute("href", "/distributions/id-1/modifier");
    expect(screen.queryByRole("button", { name: /supprimer le brouillon/i })).not.toBeInTheDocument();
  });

  it("ne propose plus de modifier une distribution en cours", () => {
    render(<DistributionActions distributionId="id-1" statut="EN_COURS" distributionDate={DATE_PASSEE} />);
    expect(screen.queryByRole("link", { name: /modifier/i })).not.toBeInTheDocument();
  });

  it("supprime un brouillon apres confirmation et revient a la liste", async () => {
    const { supprimerDistribution } = await import("@/lib/api/distributions");
    render(<DistributionActions distributionId="id-1" statut="BROUILLON" distributionDate={DATE_FUTURE} />);

    await userEvent.click(screen.getByRole("button", { name: /supprimer le brouillon/i }));
    await userEvent.click(screen.getByRole("button", { name: /^supprimer$/i }));

    expect(supprimerDistribution).toHaveBeenCalledWith("id-1");
    expect(mockPush).toHaveBeenCalledWith("/distributions");
  });
});
