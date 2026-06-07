import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RepartitionPanel } from "@/components/repartition/RepartitionPanel";
import * as distributionsApi from "@/lib/api/distributions";
import type { DenreeResponse, DotationResponse } from "@/types/distribution";

vi.mock("@/lib/api/distributions", () => ({
  listerDenrees: vi.fn(),
  saisirDenree: vi.fn(),
  modifierDenree: vi.fn(),
  supprimerDenree: vi.fn(),
  calculerDotation: vi.fn(),
}));

const denreeMock: DenreeResponse = {
  id: "denree-1",
  distributionId: "dist-1",
  libelle: "Pommes de terre",
  unite: "KILOGRAMME",
  nombreContenants: 2,
  quantiteParContenant: 25,
  quantiteTotale: 50,
};

const dotationNormale: DotationResponse = {
  distributionId: "dist-1",
  base: "INSCRITS",
  nbBeneficiaires: 10,
  denrees: [
    {
      id: "denree-1",
      libelle: "Pommes de terre",
      unite: "KILOGRAMME",
      nombreContenants: 2,
      quantiteParContenant: 25,
      quantiteTotale: 50,
      dotation: 5,
      reste: 0,
      penurie: false,
      nbPeutRecevoir: 10,
    },
  ],
};

const dotationPenurie: DotationResponse = {
  ...dotationNormale,
  nbBeneficiaires: 10,
  denrees: [
    {
      ...dotationNormale.denrees[0],
      quantiteTotale: 3,
      dotation: 1,
      reste: 0,
      penurie: true,
      nbPeutRecevoir: 3,
    },
  ],
};

describe("RepartitionPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche les denrees initiales avec la dotation", () => {
    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[denreeMock]}
        dotationInitiale={dotationNormale}
      />,
    );

    expect(screen.getByText("Pommes de terre")).toBeInTheDocument();
    expect(screen.getByText(/5 kg \/ personne/)).toBeInTheDocument();
  });

  it("affiche le message de penurie si dotation insuffisante", () => {
    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[denreeMock]}
        dotationInitiale={dotationPenurie}
      />,
    );

    expect(screen.getByText(/Stock insuffisant/)).toBeInTheDocument();
    expect(screen.getByText(/3 personne/)).toBeInTheDocument();
  });

  it("affiche le nombre de beneficiaires dans la base de calcul", () => {
    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[denreeMock]}
        dotationInitiale={dotationNormale}
      />,
    );

    expect(screen.getByText(/10 beneficiaire/)).toBeInTheDocument();
  });

  it("affiche le bouton d'ajout de denree", () => {
    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[]}
        dotationInitiale={{ ...dotationNormale, denrees: [] }}
      />,
    );

    expect(screen.getByText(/Ajouter une denree/)).toBeInTheDocument();
  });

  it("affiche le formulaire d'ajout au clic", async () => {
    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[]}
        dotationInitiale={{ ...dotationNormale, denrees: [] }}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/Ajouter une denree/));
    });

    expect(screen.getByLabelText("Libelle")).toBeInTheDocument();
  });

  it("affiche le bouton bascule inscrits / presents", () => {
    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[]}
        dotationInitiale={{ ...dotationNormale, denrees: [] }}
      />,
    );

    expect(screen.getByText("Inscrits")).toBeInTheDocument();
    expect(screen.getByText("Presents reels")).toBeInTheDocument();
  });

  it("appelle calculerDotation avec PRESENTS au clic sur la bascule", async () => {
    vi.mocked(distributionsApi.calculerDotation).mockResolvedValue({
      ...dotationNormale,
      base: "PRESENTS",
      nbBeneficiaires: 7,
    });

    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[]}
        dotationInitiale={{ ...dotationNormale, denrees: [] }}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Presents reels"));
    });

    expect(distributionsApi.calculerDotation).toHaveBeenCalledWith("dist-1", "PRESENTS");
    expect(await screen.findByText(/7 beneficiaire/)).toBeInTheDocument();
  });

  it("affiche le reste si non nul", () => {
    const dotationAvecReste: DotationResponse = {
      ...dotationNormale,
      denrees: [
        {
          ...dotationNormale.denrees[0],
          quantiteTotale: 53,
          dotation: 5,
          reste: 3,
          penurie: false,
          nbPeutRecevoir: 10,
        },
      ],
    };

    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[denreeMock]}
        dotationInitiale={dotationAvecReste}
      />,
    );

    expect(screen.getByText(/Reste : 3 kg/)).toBeInTheDocument();
  });

  it("affiche le message si aucune denree", () => {
    render(
      <RepartitionPanel
        distributionId="dist-1"
        denreesInitiales={[]}
        dotationInitiale={{ ...dotationNormale, denrees: [] }}
      />,
    );

    expect(screen.getByText(/Aucune denree saisie/)).toBeInTheDocument();
  });
});
