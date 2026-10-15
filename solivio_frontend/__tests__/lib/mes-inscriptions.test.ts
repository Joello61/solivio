import { describe, expect, it } from "vitest";
import { estAVenir, estDesistementTardif, inscriptionsAVenir, versBillet } from "@/lib/mes-inscriptions";
import type { InscriptionPersonnelle } from "@/types/distribution";

const jour = "2026-10-13";
const base = { statut: "CONFIRMEE", distributionDate: jour, distributionStatut: "PUBLIEE" };

describe("estAVenir", () => {
  it("garde une inscription active sur une distribution du jour pas encore terminee", () => {
    expect(estAVenir(base, jour)).toBe(true);
    expect(estAVenir({ ...base, distributionStatut: "EN_COURS" }, jour)).toBe(true);
  });

  it("passe a l'historique une distribution terminee ou annulee le jour meme", () => {
    expect(estAVenir({ ...base, distributionStatut: "TERMINEE" }, jour)).toBe(false);
    expect(estAVenir({ ...base, distributionStatut: "ANNULEE" }, jour)).toBe(false);
  });

  it("passe a l'historique une inscription annulee ou une date passee", () => {
    expect(estAVenir({ ...base, statut: "ANNULEE" }, jour)).toBe(false);
    expect(estAVenir({ ...base, distributionDate: "2026-10-12" }, jour)).toBe(false);
    expect(estAVenir({ ...base, distributionDate: null }, jour)).toBe(false);
  });
});

describe("billets", () => {
  const inscription = (partiel: Partial<InscriptionPersonnelle>): InscriptionPersonnelle => ({
    id: "i1",
    distributionId: "d1",
    distributionTitre: "Distribution",
    distributionDate: "2026-10-22",
    distributionLieu: "135 avenue de Rangueil",
    distributionLieuNom: "Campus Rangueil",
    distributionStatut: "PUBLIEE",
    heureDebut: "18:00:00",
    heureFin: "18:30:00",
    type: "BENEFICIAIRE",
    statut: "CONFIRMEE",
    rangListeAttente: null,
    presence: "NON_POINTE",
    absenceDeduite: false,
    dateInscription: "2026-10-10T10:00:00Z",
    ...partiel,
  });

  it("garde les inscriptions a venir, la plus proche d'abord", () => {
    const liste = [
      inscription({ id: "tard", distributionDate: "2026-10-29" }),
      inscription({ id: "passee", distributionDate: "2026-10-01" }),
      inscription({ id: "proche", distributionDate: "2026-10-22" }),
    ];
    expect(inscriptionsAVenir(liste, "2026-10-15").map((i) => i.id)).toEqual(["proche", "tard"]);
  });

  it("prepare le billet et ferme la desinscription apres pointage", () => {
    expect(versBillet(inscription({}), "2026-10-15")).toMatchObject({
      date: "2026-10-22",
      lieuNom: "Campus Rangueil",
      statut: "CONFIRMEE",
      benevole: false,
      desinscriptionPossible: true,
      desistementTardif: false,
    });
    const pointee = versBillet(
      inscription({ type: "BENEVOLE", presence: "PRESENT", statut: "LISTE_ATTENTE", rangListeAttente: 2 }),
      "2026-10-15",
      ["Accueil"],
    );
    expect(pointee).toMatchObject({ benevole: true, roles: ["Accueil"], desinscriptionPossible: false, statut: "LISTE_ATTENTE", rangListeAttente: 2 });
  });

  it("reconnait le desistement tardif d'un benevole confirme, comme le backend", () => {
    const benevole = { type: "BENEVOLE", statut: "CONFIRMEE" };
    expect(estDesistementTardif(benevole, "2026-10-15", "2026-10-15")).toBe(true);
    expect(estDesistementTardif(benevole, "2026-10-16", "2026-10-15")).toBe(true);
    expect(estDesistementTardif(benevole, "2026-10-17", "2026-10-15")).toBe(false);
    expect(estDesistementTardif({ ...benevole, statut: "LISTE_ATTENTE" }, "2026-10-15", "2026-10-15")).toBe(false);
    expect(estDesistementTardif({ ...benevole, type: "BENEFICIAIRE" }, "2026-10-15", "2026-10-15")).toBe(false);
  });
});
