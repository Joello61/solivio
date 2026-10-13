import { describe, expect, it } from "vitest";
import { peutPointer, typeInscriptionPossible } from "@/lib/droits-distribution";
import type { InscriptionResponse } from "@/types/distribution";

function inscription(type: "BENEVOLE" | "BENEFICIAIRE", statut: "CONFIRMEE" | "LISTE_ATTENTE"): InscriptionResponse {
  return {
    id: "i1", distributionId: "d1", creneauId: null, nom: "Dupont", prenom: "Marie", type, statut,
    rangListeAttente: null, roles: [], presence: "NON_POINTE",
    absenceDeduite: false, dateInscription: "2026-10-01T10:00:00Z",
    nombreAbsencesPassees: 0,
  } as InscriptionResponse;
}

describe("peutPointer", () => {
  it("ouvre le pointage au benevole confirme une fois la distribution demarree", () => {
    expect(peutPointer(["benevole"], "EN_COURS", [inscription("BENEVOLE", "CONFIRMEE")])).toBe(true);
  });

  it("le refuse au benevole non inscrit ou en liste d'attente, et avant le demarrage", () => {
    expect(peutPointer(["benevole"], "EN_COURS", [])).toBe(false);
    expect(peutPointer(["benevole"], "EN_COURS", [inscription("BENEVOLE", "LISTE_ATTENTE")])).toBe(false);
    expect(peutPointer(["benevole"], "PUBLIEE", [inscription("BENEVOLE", "CONFIRMEE")])).toBe(false);
  });

  it("l'ouvre toujours au gestionnaire sur une distribution en cours", () => {
    expect(peutPointer(["coordinateur"], "EN_COURS", [])).toBe(true);
  });
});

describe("typeInscriptionPossible", () => {
  it("propose le benevolat au coordinateur et au responsable (spec 4.5)", () => {
    expect(typeInscriptionPossible(["coordinateur"])).toBe("BENEVOLE");
    expect(typeInscriptionPossible(["responsable"])).toBe("BENEVOLE");
    expect(typeInscriptionPossible(["benevole"])).toBe("BENEVOLE");
  });

  it("inscrit le beneficiaire comme beneficiaire et rien pour un compte sans role", () => {
    expect(typeInscriptionPossible(["beneficiaire"])).toBe("BENEFICIAIRE");
    expect(typeInscriptionPossible([])).toBeNull();
  });
});
