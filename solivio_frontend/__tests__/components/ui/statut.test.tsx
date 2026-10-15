import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Statut } from "@/components/ui/statut";
import {
  STATUT_DISTRIBUTION,
  STATUT_EVENEMENT,
  STATUT_INSCRIPTION,
  STATUT_MISSION,
  STATUT_PRESENCE,
  STATUT_SESSION,
} from "@/lib/libelles";

describe("libelles de statut", () => {
  it("suit le vocabulaire du glossaire pour le cycle d'une distribution", () => {
    expect(Object.values(STATUT_DISTRIBUTION).map((l) => l.texte)).toEqual([
      "Brouillon",
      "Publiée",
      "En cours",
      "Terminée",
      "Annulée",
    ]);
    expect(STATUT_SESSION).toBe(STATUT_DISTRIBUTION);
  });

  it("met en avant ce qui se passe maintenant, et seulement cela", () => {
    expect(STATUT_DISTRIBUTION.EN_COURS.ton).toBe("maintenant");
    expect(STATUT_EVENEMENT.EN_COURS.ton).toBe("maintenant");
    expect(STATUT_MISSION.PRISE_EN_CHARGE.ton).toBe("maintenant");
    expect(STATUT_DISTRIBUTION.TERMINEE.ton).toBe("passe");
  });

  it("n'utilise aucune forme genree en (e)", () => {
    const textes = [STATUT_INSCRIPTION, STATUT_PRESENCE].flatMap((m) => Object.values(m).map((l) => l.texte));
    expect(textes.filter((t) => t.includes("(e)"))).toEqual([]);
  });
});

describe("Statut", () => {
  it("affiche le libelle et son complement", () => {
    render(<Statut libelle={STATUT_INSCRIPTION.LISTE_ATTENTE} detail="rang 3" />);
    expect(screen.getByText("Liste d'attente, rang 3")).toBeInTheDocument();
  });

  it("ajoute un point decoratif pour un statut en cours", () => {
    const { container } = render(<Statut libelle={STATUT_DISTRIBUTION.EN_COURS} />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.getByText("En cours")).toBeInTheDocument();
  });
});
