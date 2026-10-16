import { describe, expect, it } from "vitest";
import { estGestionnaireDistribution, typesInscriptionPossibles } from "@/lib/droits-distribution";

describe("estGestionnaireDistribution", () => {
  it("reconnait coordinateurs, responsables et super admins", () => {
    expect(estGestionnaireDistribution(["coordinateur"])).toBe(true);
    expect(estGestionnaireDistribution(["responsable"])).toBe(true);
    expect(estGestionnaireDistribution(["super_admin"])).toBe(true);
    expect(estGestionnaireDistribution(["benevole", "beneficiaire"])).toBe(false);
  });
});

describe("typesInscriptionPossibles", () => {
  it("demande le role correspondant a chaque type (ADR-012)", () => {
    expect(typesInscriptionPossibles(["beneficiaire"])).toEqual(["BENEFICIAIRE"]);
    expect(typesInscriptionPossibles(["benevole"])).toEqual(["BENEVOLE"]);
  });

  it("ouvre les deux places a qui est benevole et beneficiaire, beneficiaire d'abord", () => {
    expect(typesInscriptionPossibles(["benevole", "beneficiaire"])).toEqual(["BENEFICIAIRE", "BENEVOLE"]);
  });

  it("ne donne rien aux roles de gestion seuls", () => {
    expect(typesInscriptionPossibles(["coordinateur"])).toEqual([]);
    expect(typesInscriptionPossibles(["responsable"])).toEqual([]);
    expect(typesInscriptionPossibles(["coordinateur", "benevole"])).toEqual(["BENEVOLE"]);
  });
});
