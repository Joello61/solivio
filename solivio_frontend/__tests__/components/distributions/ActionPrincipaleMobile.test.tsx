import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionPrincipaleMobile, actionPrincipale } from "@/components/distributions/ActionPrincipaleMobile";

const base = { estGestionnaire: false, pointageBenevole: false, peutSInscrire: true, dejaInscrit: false };

describe("actionPrincipale", () => {
  it("met le pointage en avant pendant la distribution, pour qui peut pointer", () => {
    expect(actionPrincipale({ ...base, statut: "EN_COURS", estGestionnaire: true })).toBe("pointage");
    expect(actionPrincipale({ ...base, statut: "EN_COURS", pointageBenevole: true })).toBe("pointage");
    expect(actionPrincipale({ ...base, statut: "EN_COURS" })).toBeNull();
  });

  it("propose l'inscription sur une distribution publiee, sauf a qui est deja inscrit", () => {
    expect(actionPrincipale({ ...base, statut: "PUBLIEE" })).toBe("inscription");
    expect(actionPrincipale({ ...base, statut: "PUBLIEE", dejaInscrit: true })).toBeNull();
    expect(actionPrincipale({ ...base, statut: "PUBLIEE", peutSInscrire: false })).toBeNull();
    expect(actionPrincipale({ ...base, statut: "BROUILLON" })).toBeNull();
  });
});

describe("ActionPrincipaleMobile", () => {
  it("mene au pointage ou a la carte d'inscription", () => {
    const { rerender } = render(<ActionPrincipaleMobile action="pointage" distributionId="d1" />);
    expect(screen.getByRole("link", { name: /Ouvrir le pointage/ })).toHaveAttribute("href", "/distributions/d1/pointage");
    rerender(<ActionPrincipaleMobile action="inscription" distributionId="d1" />);
    expect(screen.getByRole("link", { name: /S'inscrire/ })).toHaveAttribute("href", "#mon-inscription");
  });

  it("ne rend rien sans action", () => {
    const { container } = render(<ActionPrincipaleMobile action={null} distributionId="d1" />);
    expect(container).toBeEmptyDOMElement();
  });
});
