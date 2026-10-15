import { describe, expect, it } from "vitest";
import {
  depuisMission,
  depuisParticipation,
  depuisSession,
  engagements,
  evenementCherchantEquipe,
  jourEtHeure,
  missionAPrendre,
  placesEquipe,
} from "@/lib/engagements";
import type { MissionCollecteResponse } from "@/types/collecte";
import type { EvenementResponse, ParticipationEvenementResponse } from "@/types/evenement";
import type { InscriptionReconditionnementResponse } from "@/types/reconditionnement";

const maintenant = new Date("2026-10-15T10:00:00Z");

const mission = (partiel: Partial<MissionCollecteResponse> = {}): MissionCollecteResponse => ({
  id: "m1",
  titre: "Collecte boulangerie",
  description: null,
  lieuCollecte: { placeId: null, adresseFormatee: "12 rue Alsace", latitude: null, longitude: null },
  lieuDepot: null,
  dateHeure: "2026-10-16T16:30:00Z",
  capacitePersonnes: 6,
  statut: "PRISE_EN_CHARGE",
  benevoleId: null,
  benevoleNomComplet: null,
  assigneAuLecteur: true,
  datePriseEnCharge: null,
  dateCollecteEffectuee: null,
  dateDepotValide: null,
  raisonAnnulation: null,
  dateCreation: "2026-10-01T10:00:00Z",
  ...partiel,
});

const evenement = (partiel: Partial<EvenementResponse> = {}): EvenementResponse => ({
  id: "e1",
  titre: "Stand de rentrée",
  description: null,
  type: "STAND",
  lieuPlaceId: null,
  lieuAdresseFormatee: "Campus",
  lieuLatitude: null,
  lieuLongitude: null,
  dateHeureDebut: "2026-10-20T12:00:00Z",
  dateHeureFin: "2026-10-20T15:00:00Z",
  aBesoiNStaff: true,
  ouvertParticipants: false,
  publicParticipants: null,
  modeInscription: "OBLIGATOIRE",
  capaciteStaff: 4,
  capaciteParticipants: null,
  statut: "PUBLIE",
  raisonAnnulation: null,
  nbStaff: 1,
  nbParticipants: 0,
  dateCreation: "2026-10-01T10:00:00Z",
  ...partiel,
});

const participation: ParticipationEvenementResponse = {
  id: "p1",
  evenementId: "e1",
  evenementTitre: "Stand de rentrée",
  evenementDate: "2026-10-20T12:00:00Z",
  evenementLieu: "Campus",
  personneId: "x",
  personneNomComplet: "Moi",
  role: "STAFF",
  presence: "NON_POINTE",
  dateInscription: "2026-10-10T10:00:00Z",
};

const session: InscriptionReconditionnementResponse = {
  id: "s1",
  sessionId: "sess1",
  sessionTitre: "Tri des vêtements",
  sessionDate: "2026-10-12T08:00:00Z",
  sessionLieu: "Local",
  personneId: "x",
  nomComplet: "Moi",
  statut: "CONFIRMEE",
  presence: "PRESENT",
  dateInscription: "2026-10-01T10:00:00Z",
};

describe("engagements", () => {
  it("donne jour et heure dans le fuseau de l'association", () => {
    expect(jourEtHeure("2026-10-16T22:30:00Z")).toEqual({ date: "2026-10-17", heure: "00:30" });
  });

  it("garde une mission prise a faire tant qu'elle n'est pas deposee", () => {
    expect(depuisMission(mission())).toMatchObject({ detail: "à collecter", aVenir: true, href: "/missions-collecte/m1" });
    expect(depuisMission(mission({ statut: "COLLECTE_EFFECTUEE" })).detail).toBe("à déposer");
    expect(depuisMission(mission({ statut: "DEPOT_VALIDE" })).aVenir).toBe(false);
    expect(missionAPrendre(mission({ statut: "DISPONIBLE" })).detail).toBe("à prendre");
  });

  it("classe un evenement annule dans le passe", () => {
    const actif = depuisParticipation(participation, new Map([["e1", evenement()]]), maintenant);
    expect(actif).toMatchObject({ titre: "Stand de rentrée", detail: "dans l'équipe", aVenir: true });
    const annule = depuisParticipation(participation, new Map([["e1", evenement({ statut: "ANNULE" })]]), maintenant);
    expect(annule).toMatchObject({ detail: "annulé", aVenir: false });
    expect(depuisParticipation(participation, new Map(), maintenant)?.aVenir).toBe(true);
  });

  it("classe une session passee ou annulee dans l'historique", () => {
    expect(depuisSession(session, maintenant)).toMatchObject({ aVenir: false, detail: "présence notée" });
    expect(depuisSession({ ...session, sessionDate: "2026-10-22T08:00:00Z" }, maintenant)?.aVenir).toBe(true);
    expect(depuisSession({ ...session, sessionDate: "2026-10-22T08:00:00Z", statut: "ANNULEE" }, maintenant)?.aVenir).toBe(false);
    expect(depuisSession({ ...session, sessionDate: null }, maintenant)).toBeNull();
  });

  it("reunit les sources dans l'ordre chronologique", () => {
    const liste = engagements(
      { missions: [mission()], participations: [participation], evenements: [evenement()], sessions: [session] },
      maintenant,
    );
    expect(liste.map((e) => e.type)).toEqual(["session", "mission", "evenement"]);
    expect(engagements({ missions: null, participations: null, evenements: null, sessions: null }, maintenant)).toEqual([]);
  });

  it("compte les places d'equipe d'un evenement", () => {
    expect(placesEquipe(evenement())).toBe(3);
    expect(placesEquipe(evenement({ capaciteStaff: null }))).toBe(Number.POSITIVE_INFINITY);
    expect(placesEquipe(evenement({ aBesoiNStaff: false }))).toBeNull();
    expect(placesEquipe(evenement({ statut: "BROUILLON" }))).toBeNull();
    expect(evenementCherchantEquipe(evenement()).detail).toBe("3 places dans l'équipe");
    expect(evenementCherchantEquipe(evenement({ capaciteStaff: null })).detail).toBe("cherche une équipe");
  });
});
