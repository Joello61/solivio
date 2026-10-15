import { describe, expect, it } from "vitest";
import { arrivage, phrasePenurie, quantite } from "@/lib/repartition";
import type { DotationDenreeDto } from "@/types/distribution";

describe("quantite", () => {
  it("accorde l'unite et garde la virgule decimale", () => {
    expect(quantite(0.5, "KILOGRAMME")).toBe("0,5 kg");
    expect(quantite(1, "PIECE")).toBe("1 pièce");
    expect(quantite(12, "PIECE")).toBe("12 pièces");
    expect(quantite(2, "UNITE")).toBe("2 unités");
  });
});

describe("arrivage", () => {
  it("dit les contenants et le total", () => {
    expect(arrivage({ nombreContenants: 12, quantiteParContenant: 5, quantiteTotale: 60, unite: "KILOGRAMME" })).toBe(
      "12 contenants de 5 kg, soit 60 kg",
    );
    expect(arrivage({ nombreContenants: 1, quantiteParContenant: 5, quantiteTotale: 5, unite: "LITRE" })).toBe("1 contenant de 5 L");
  });
});

describe("phrasePenurie", () => {
  const riz = { libelle: "Riz", unite: "KILOGRAMME", quantiteTotale: 50, dotation: 1, nbPeutRecevoir: 50 } as DotationDenreeDto;

  it("dit qui recoit combien (RG8)", () => {
    expect(phrasePenurie(riz, 100)).toBe("1 kg par personne, pour 50 bénéficiaires sur 100.");
  });

  it("annonce quand personne ne peut en recevoir", () => {
    expect(phrasePenurie({ ...riz, quantiteTotale: 0.4, nbPeutRecevoir: 0 }, 100)).toBe(
      "Pas assez pour en donner à chacun : 0,4 kg en tout.",
    );
  });
});
