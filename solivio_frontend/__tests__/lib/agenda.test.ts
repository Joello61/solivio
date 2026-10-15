import { describe, expect, it } from "vitest";
import {
  grouperParSemaine,
  horaire,
  libellePlaces,
  libelleSemaine,
  lieuCourt,
  lundiDe,
  placesPour,
  plageDistribution,
  quand,
} from "@/lib/agenda";
import type { DistributionResponse } from "@/types/distribution";

function distribution(partiel: Partial<DistributionResponse> = {}): DistributionResponse {
  return {
    id: "d1",
    titre: "Distribution",
    description: null,
    lieu: null,
    date: "2026-10-22",
    statut: "PUBLIEE",
    capaciteBeneficiaires: 80,
    capaciteBenevoles: 14,
    modeCreneau: "CRENEAUX_DECOUPES",
    baseRepartition: "INSCRITS",
    motifAnnulation: null,
    dateCreation: "2026-10-01T10:00:00Z",
    creneaux: [
      { id: "c2", heureDebut: "18:00:00", heureFin: "19:30:00", capacite: 40, placesRestantes: 10, confirmes: null, enAttente: null },
      { id: "c1", heureDebut: "17:30:00", heureFin: "18:00:00", capacite: 40, placesRestantes: 0, confirmes: null, enAttente: null },
    ],
    remplissage: {
      placesRestantesBeneficiaires: 52,
      placesRestantesBenevoles: 5,
      beneficiairesConfirmes: null,
      beneficiairesEnAttente: null,
      benevolesConfirmes: null,
      benevolesEnAttente: null,
    },
    ...partiel,
  };
}

describe("agenda", () => {
  it("met en forme l'horaire et la plage d'une distribution", () => {
    expect(horaire("17:30:00", "19:30:00")).toBe("17:30 - 19:30");
    expect(horaire(null, null)).toBeNull();
    expect(plageDistribution(distribution())).toBe("17:30 - 19:30");
    expect(plageDistribution(distribution({ creneaux: [] }))).toBeNull();
  });

  it("prefere le nom du lieu a son adresse", () => {
    expect(lieuCourt({ nom: "Campus Rangueil", adresseFormatee: "135 avenue" })).toBe("Campus Rangueil");
    expect(lieuCourt({ nom: null, adresseFormatee: "135 avenue" })).toBe("135 avenue");
    expect(lieuCourt(null)).toBeNull();
  });

  it("donne les places du type d'inscription du membre", () => {
    expect(placesPour(distribution(), "BENEFICIAIRE")).toEqual({ restantes: 52, capacite: 80 });
    expect(placesPour(distribution(), "BENEVOLE")).toEqual({ restantes: 5, capacite: 14 });
    expect(placesPour(distribution({ capaciteBenevoles: null }), "BENEVOLE")).toBeNull();
  });

  it("dit complet sans fermer la porte", () => {
    expect(libellePlaces(0)).toBe("Complet, liste d'attente possible");
    expect(libellePlaces(1)).toBe("1 place restante");
    expect(libellePlaces(12)).toBe("12 places restantes");
  });

  it("regroupe par semaine du lundi au dimanche", () => {
    expect(lundiDe("2026-10-22")).toBe("2026-10-19");
    expect(lundiDe("2026-10-19")).toBe("2026-10-19");
    expect(lundiDe("2026-10-25")).toBe("2026-10-19");
    expect(libelleSemaine("2026-10-12", "2026-10-15")).toBe("Cette semaine");
    expect(libelleSemaine("2026-10-19", "2026-10-15")).toBe("Semaine prochaine");
    expect(libelleSemaine("2026-10-26", "2026-10-15")).toBe("Semaine du 26 octobre");

    const semaines = grouperParSemaine(["2026-10-29", "2026-10-15", "2026-10-16", "2026-10-22"], (d) => d, "2026-10-15");
    expect(semaines.map((s) => [s.libelle, s.elements])).toEqual([
      ["Cette semaine", ["2026-10-15", "2026-10-16"]],
      ["Semaine prochaine", ["2026-10-22"]],
      ["Semaine du 26 octobre", ["2026-10-29"]],
    ]);
  });

  it("dit quand en mots simples", () => {
    expect(quand("2026-10-15", "2026-10-15")).toBe("aujourd'hui");
    expect(quand("2026-10-16", "2026-10-15")).toBe("demain");
    expect(quand("2026-10-20", "2026-10-15")).toBe("mardi");
    expect(quand("2026-10-29", "2026-10-15")).toBe("jeudi 29 octobre");
  });
});
