import { describe, expect, it } from "vitest";
import {
  actionsCycle,
  dateDupliquee,
  etapeCycle,
  sectionPlanning,
  tachesDistributions,
  titrePropose,
} from "@/lib/cycle-distribution";
import type { DistributionResponse } from "@/types/distribution";

const aujourdhui = "2026-10-15";

function distribution(partiel: Partial<DistributionResponse> = {}, remplissage: Partial<DistributionResponse["remplissage"]> = {}): DistributionResponse {
  return {
    id: "d1",
    titre: "Distribution",
    description: null,
    lieu: null,
    date: "2026-10-22",
    statut: "PUBLIEE",
    capaciteBeneficiaires: 80,
    capaciteBenevoles: 14,
    modeCreneau: "CRENEAU_UNIQUE",
    baseRepartition: "INSCRITS",
    motifAnnulation: null,
    dateCreation: "2026-10-01T10:00:00Z",
    creneaux: [],
    remplissage: {
      placesRestantesBeneficiaires: 40,
      placesRestantesBenevoles: 0,
      beneficiairesConfirmes: 40,
      beneficiairesEnAttente: 0,
      benevolesConfirmes: 14,
      benevolesEnAttente: 0,
      ...remplissage,
    },
    ...partiel,
  };
}

describe("cycle d'une distribution", () => {
  it("place chaque statut sur le rail", () => {
    expect(etapeCycle("BROUILLON")).toBe(0);
    expect(etapeCycle("PUBLIEE")).toBe(2);
    expect(etapeCycle("EN_COURS")).toBe(3);
    expect(etapeCycle("TERMINEE")).toBe(5);
    expect(etapeCycle("ANNULEE")).toBeNull();
  });

  it("donne une action principale par etape, comme le backend le permet", () => {
    expect(actionsCycle({ statut: "BROUILLON", date: "2026-10-22" }, aujourdhui)).toEqual({
      principale: "publier",
      secondaire: null,
      menu: ["modifier", "dupliquer", "supprimer", "annuler"],
    });
    expect(actionsCycle({ statut: "PUBLIEE", date: "2026-10-22" }, aujourdhui).principale).toBeNull();
    expect(actionsCycle({ statut: "PUBLIEE", date: aujourdhui }, aujourdhui).principale).toBe("demarrer");
    expect(actionsCycle({ statut: "EN_COURS", date: aujourdhui }, aujourdhui)).toEqual({
      principale: "ouvrir-jour-j",
      secondaire: "terminer",
      menu: ["dupliquer", "annuler-demarrage", "annuler"],
    });
    expect(actionsCycle({ statut: "TERMINEE", date: "2026-10-07" }, aujourdhui).menu).toEqual(["dupliquer"]);
    expect(actionsCycle({ statut: "ANNULEE", date: "2026-10-24" }, aujourdhui).menu).toEqual(["reactiver", "dupliquer"]);
    expect(actionsCycle({ statut: "ANNULEE", date: "2026-10-01" }, aujourdhui).menu).toEqual(["dupliquer"]);
  });

  it("duplique a la meme heure une semaine plus tard, jamais dans le passe", () => {
    expect(dateDupliquee("2026-10-22", aujourdhui)).toBe("2026-10-29");
    expect(dateDupliquee("2026-09-24", aujourdhui)).toBe("2026-10-15");
    expect(titrePropose("2026-10-22")).toBe("Distribution du jeudi 22 octobre");
  });

  it("range les distributions du planning", () => {
    expect(sectionPlanning({ statut: "BROUILLON", date: "2026-10-01" }, aujourdhui)).toBe("brouillons");
    expect(sectionPlanning({ statut: "PUBLIEE", date: aujourdhui }, aujourdhui)).toBe("a-venir");
    expect(sectionPlanning({ statut: "EN_COURS", date: "2026-10-14" }, aujourdhui)).toBe("a-venir");
    expect(sectionPlanning({ statut: "PUBLIEE", date: "2026-10-14" }, aujourdhui)).toBe("passees");
    expect(sectionPlanning({ statut: "TERMINEE", date: "2026-10-07" }, aujourdhui)).toBe("passees");
    expect(sectionPlanning({ statut: "ANNULEE", date: "2026-10-24" }, aujourdhui)).toBe("annulees");
  });
});

describe("taches du coordinateur", () => {
  it("signale ce qui demande une action, le plus pressant d'abord", () => {
    const taches = tachesDistributions(
      [
        distribution({ id: "attente", date: "2026-10-29" }, { beneficiairesEnAttente: 6 }),
        distribution({ id: "peu", date: "2026-10-20" }, { beneficiairesConfirmes: 12, placesRestantesBenevoles: 5, benevolesConfirmes: 9 }),
        distribution({ id: "brouillon", statut: "BROUILLON", date: "2026-11-05" }),
        distribution({ id: "ouverte", statut: "EN_COURS", date: "2026-10-14" }),
      ],
      aujourdhui,
    );
    expect(taches.map((t) => t.cle)).toEqual([
      "cloture-ouverte",
      "brouillon-brouillon",
      "peu-peu",
      "benevoles-peu",
      "attente-attente",
    ]);
    expect(taches.find((t) => t.cle === "benevoles-peu")).toMatchObject({
      titre: "5 bénévoles manquent",
      detail: "Mardi 20 octobre : 9 sur 14 dans l'équipe.",
    });
    expect(taches.find((t) => t.cle === "peu-peu")?.detail).toBe("Mardi 20 octobre : 12 sur 80 places.");
  });

  it("ne dit rien d'une distribution lointaine bien remplie", () => {
    expect(tachesDistributions([distribution({ date: "2026-12-01" }, { placesRestantesBenevoles: 3 })], aujourdhui)).toEqual([]);
  });
});
