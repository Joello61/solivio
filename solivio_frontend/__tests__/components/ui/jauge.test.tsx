import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Jauge } from "@/components/ui/jauge";

describe("Jauge", () => {
  it("expose le remplissage, nomme, aux lecteurs d'ecran", () => {
    render(<Jauge valeur={48} capacite={80} libelle="48 inscrits sur 80" detail="32 places" />);
    const jauge = screen.getByRole("meter", { name: "48 inscrits sur 80" });
    expect(jauge).toHaveAttribute("aria-valuenow", "48");
    expect(jauge).toHaveAttribute("aria-valuemax", "80");
    expect(jauge).toHaveAttribute("aria-valuetext", "48 inscrits sur 80, 32 places");
  });

  it("dessine la liste d'attente apres les places confirmees", () => {
    render(<Jauge valeur={60} capacite={60} attente={6} libelle="Complet" />);
    const segments = screen.getByRole("meter").children;
    expect(segments).toHaveLength(2);
    expect((segments[0] as HTMLElement).style.width).toBe(`${(60 / 66) * 100}%`);
  });

  it("reste vide sans capacite", () => {
    render(<Jauge valeur={0} capacite={0} libelle="Aucune place" />);
    expect((screen.getByRole("meter").children[0] as HTMLElement).style.width).toBe("0%");
  });

  it("nomme la jauge quand le texte est masque", () => {
    render(<Jauge valeur={3} capacite={10} libelle="3 sur 10" sansTexte />);
    expect(screen.getByRole("meter", { name: "3 sur 10" })).toBeInTheDocument();
  });
});
