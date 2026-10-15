import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MissionActions } from "@/components/collecte/MissionActions";
import { actionsMission } from "@/lib/missions";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const api = vi.hoisted(() => ({
  prendreEnCharge: vi.fn(),
  libererMission: vi.fn(),
  validerCollecte: vi.fn(),
  validerDepot: vi.fn(),
  annulerMission: vi.fn(),
}));
vi.mock("@/lib/api/collecte", () => api);

const benevole = { assigneAuLecteur: false, estGestionnaire: false, estBenevole: true };
const responsable = { assigneAuLecteur: false, estGestionnaire: true, estBenevole: true };

describe("actionsMission", () => {
  it("donne une seule etape suivante selon le role", () => {
    expect(actionsMission({ ...benevole, statut: "DISPONIBLE" })).toEqual({ principale: "prendre", autres: [] });
    expect(actionsMission({ ...benevole, assigneAuLecteur: true, statut: "PRISE_EN_CHARGE" })).toEqual({
      principale: null,
      autres: ["liberer", "annuler"],
    });
    expect(actionsMission({ ...benevole, assigneAuLecteur: true, statut: "COLLECTE_EFFECTUEE" }).principale).toBe(
      "valider-depot",
    );
    expect(actionsMission({ ...responsable, statut: "PRISE_EN_CHARGE" }).principale).toBe("valider-collecte");
  });

  it("ne propose rien a un benevole non assigne sur une mission prise ou finie", () => {
    expect(actionsMission({ ...benevole, statut: "PRISE_EN_CHARGE" })).toEqual({ principale: null, autres: [] });
    expect(actionsMission({ ...responsable, statut: "DEPOT_VALIDE" })).toEqual({ principale: null, autres: [] });
  });

  it("ne laisse modifier qu'une mission encore disponible", () => {
    expect(actionsMission({ ...responsable, statut: "DISPONIBLE" }).autres).toContain("modifier");
    expect(actionsMission({ ...responsable, statut: "PRISE_EN_CHARGE" }).autres).not.toContain("modifier");
  });
});

describe("MissionActions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("prend la mission en un geste", async () => {
    api.prendreEnCharge.mockResolvedValue({});
    render(<MissionActions missionId="m1" statut="DISPONIBLE" {...benevole} />);
    await userEvent.click(screen.getByRole("button", { name: "Prendre la mission" }));
    expect(api.prendreEnCharge).toHaveBeenCalledWith("m1");
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("annule avec un motif obligatoire, depuis le menu", async () => {
    api.annulerMission.mockResolvedValue({});
    render(<MissionActions missionId="m1" statut="PRISE_EN_CHARGE" {...benevole} assigneAuLecteur />);

    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions sur la mission" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Annuler la mission" }));
    const confirmer = screen.getByRole("button", { name: "Annuler la mission" });
    expect(confirmer).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Motif"), "Magasin ferme");
    await userEvent.click(confirmer);

    expect(api.annulerMission).toHaveBeenCalledWith("m1", "Magasin ferme");
  });

  it("laisse rendre sa mission en clair quand il n'y a pas d'etape a franchir", async () => {
    api.libererMission.mockResolvedValue({});
    render(<MissionActions missionId="m1" statut="PRISE_EN_CHARGE" {...benevole} assigneAuLecteur />);
    await userEvent.click(screen.getByRole("button", { name: "Rendre la mission" }));
    expect(api.libererMission).toHaveBeenCalledWith("m1");
  });

  it("n'affiche rien sans action possible", () => {
    const { container } = render(<MissionActions missionId="m1" statut="PRISE_EN_CHARGE" {...benevole} />);
    expect(container).toBeEmptyDOMElement();
  });
});
