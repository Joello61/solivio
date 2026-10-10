import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MissionActions } from "@/components/collecte/MissionActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/api/collecte", () => ({
  prendreEnCharge: vi.fn(),
  libererMission: vi.fn(),
  validerCollecte: vi.fn(),
  validerDepot: vi.fn(),
  annulerMission: vi.fn(),
}));

describe("MissionActions", () => {
  it("propose au benevole assigne de se desister et d'annuler sa mission", () => {
    render(
      <MissionActions missionId="m1" statut="PRISE_EN_CHARGE" assigneAuLecteur estGestionnaire={false} estBenevole />,
    );
    expect(screen.getByRole("button", { name: /Se desister/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Annuler la mission/i })).toBeInTheDocument();
  });

  it("ne propose rien a un benevole non assigne sur une mission prise", () => {
    const { container } = render(
      <MissionActions
        missionId="m1"
        statut="PRISE_EN_CHARGE"
        assigneAuLecteur={false}
        estGestionnaire={false}
        estBenevole
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("propose au gestionnaire de valider la collecte et d'annuler", () => {
    render(
      <MissionActions
        missionId="m1"
        statut="PRISE_EN_CHARGE"
        assigneAuLecteur={false}
        estGestionnaire
        estBenevole={false}
      />,
    );
    expect(screen.getByRole("button", { name: /Valider la collecte/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Annuler la mission/i })).toBeInTheDocument();
  });
});
