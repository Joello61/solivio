import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DistributionDuJour } from "@/components/dashboard/DistributionDuJour";
import type { DistributionResponse } from "@/types/distribution";

const distribution = (statut: DistributionResponse["statut"]) =>
  ({
    id: "d1",
    titre: "Distribution du jeudi",
    statut,
    date: "2026-10-11",
    lieu: { adresseFormatee: "Place du Capitole" },
    creneaux: [{ id: "c1", heureDebut: "17:00:00", heureFin: "19:00:00", capacite: 20 }],
  }) as unknown as DistributionResponse;

describe("DistributionDuJour", () => {
  it("ouvre le pointage d'une distribution en cours", () => {
    render(<DistributionDuJour distributions={[distribution("EN_COURS")]} />);
    expect(screen.getByRole("link", { name: /Ouvrir le jour J/ })).toHaveAttribute("href", "/distributions/d1/pointage");
    expect(screen.getByText("17:00 - 19:00")).toBeInTheDocument();
  });

  it("renvoie vers le detail tant qu'elle n'a pas demarre", () => {
    render(<DistributionDuJour distributions={[distribution("PUBLIEE")]} />);
    expect(screen.getByRole("link", { name: /Voir la distribution/ })).toHaveAttribute("href", "/distributions/d1");
  });

  it("ne rend rien sans distribution du jour", () => {
    const { container } = render(<DistributionDuJour distributions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
