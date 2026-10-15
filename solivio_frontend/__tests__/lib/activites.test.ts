import { describe, expect, it } from "vitest";
import { etapeActivite, placesOuvertes, quandActivite, sectionActivite, sectionMission, trierActivites } from "@/lib/activites";
import type { EvenementResponse } from "@/types/evenement";

const maintenant = new Date("2026-10-15T10:00:00Z");

describe("sectionActivite", () => {
  it("range brouillons, annulees, passees et a venir", () => {
    expect(sectionActivite({ statut: "BROUILLON", dateHeureFin: "2026-10-01T10:00:00Z" }, maintenant)).toBe("brouillons");
    expect(sectionActivite({ statut: "ANNULE", dateHeureFin: "2026-10-20T10:00:00Z" }, maintenant)).toBe("annulees");
    expect(sectionActivite({ statut: "ANNULEE", dateHeureFin: "2026-10-20T10:00:00Z" }, maintenant)).toBe("annulees");
    expect(sectionActivite({ statut: "TERMINEE", dateHeureFin: "2026-10-20T10:00:00Z" }, maintenant)).toBe("passees");
    expect(sectionActivite({ statut: "PUBLIE", dateHeureFin: "2026-10-14T10:00:00Z" }, maintenant)).toBe("passees");
    expect(sectionActivite({ statut: "EN_COURS", dateHeureFin: "2026-10-15T12:00:00Z" }, maintenant)).toBe("a-venir");
  });
});

describe("etapeActivite", () => {
  it("place evenements et sessions sur le meme rail", () => {
    expect(etapeActivite("BROUILLON")).toBe(0);
    expect(etapeActivite("PUBLIE")).toBe(2);
    expect(etapeActivite("PUBLIEE")).toBe(2);
    expect(etapeActivite("EN_COURS")).toBe(3);
    expect(etapeActivite("TERMINE")).toBe(5);
    expect(etapeActivite("ANNULEE")).toBeNull();
  });
});

describe("sectionMission", () => {
  it("regroupe les missions prises et collectees en cours", () => {
    expect(sectionMission("DISPONIBLE")).toBe("a-pourvoir");
    expect(sectionMission("PRISE_EN_CHARGE")).toBe("en-cours");
    expect(sectionMission("COLLECTE_EFFECTUEE")).toBe("en-cours");
    expect(sectionMission("DEPOT_VALIDE")).toBe("terminees");
  });
});

describe("quandActivite", () => {
  it("donne le jour et la plage a l'heure de Paris", () => {
    expect(quandActivite("2026-10-15T12:00:00Z", "2026-10-15T15:30:00Z")).toEqual({ date: "2026-10-15", plage: "14:00 - 17:30" });
  });

  it("dit la fin quand l'activite deborde sur un autre jour", () => {
    expect(quandActivite("2026-10-15T18:00:00Z", "2026-10-16T08:00:00Z").plage).toBe("20:00, jusqu'au vendredi 16 octobre 10:00");
  });
});

describe("trierActivites", () => {
  const dates = ["2026-10-20", "2026-10-10", "2026-10-15"];
  it("met le plus proche d'abord a venir et le plus recent d'abord dans le passe", () => {
    expect(trierActivites(dates, "a-venir", (d) => d)).toEqual(["2026-10-10", "2026-10-15", "2026-10-20"]);
    expect(trierActivites(dates, "passees", (d) => d)).toEqual(["2026-10-20", "2026-10-15", "2026-10-10"]);
  });
});

describe("placesOuvertes", () => {
  const base = {
    statut: "PUBLIE",
    modeInscription: "OBLIGATOIRE",
    aBesoiNStaff: true,
    capaciteStaff: 2,
    nbStaff: 2,
    ouvertParticipants: true,
    publicParticipants: "BENEFICIAIRES",
    capaciteParticipants: null,
    nbParticipants: 4,
  } as EvenementResponse;

  it("ouvre le staff aux benevoles et la participation au public vise", () => {
    expect(placesOuvertes(base, ["benevole"])).toEqual([{ role: "STAFF", complet: true }]);
    expect(placesOuvertes(base, ["beneficiaire"])).toEqual([{ role: "PARTICIPANT", complet: false }]);
  });

  it("ne propose rien sans inscription ni hors publication", () => {
    expect(placesOuvertes({ ...base, modeInscription: "SANS_INSCRIPTION" }, ["benevole"])).toEqual([]);
    expect(placesOuvertes({ ...base, statut: "BROUILLON" }, ["benevole"])).toEqual([]);
  });
});
