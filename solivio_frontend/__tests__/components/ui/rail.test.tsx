import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Rail } from "@/components/ui/rail";

describe("Rail", () => {
  it("marque l'etape en cours et les etapes faites", () => {
    render(<Rail libelle="Avancement" etapes={["Préparer", "Publier", "Remplir"]} courante={1} />);
    const etapes = screen.getAllByRole("listitem");
    expect(etapes[1]).toHaveAttribute("aria-current", "step");
    expect(etapes[0]).toHaveTextContent("Préparer (faite)");
    expect(etapes[2]).not.toHaveAttribute("aria-current");
  });
});
