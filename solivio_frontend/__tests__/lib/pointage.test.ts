import { describe, expect, it } from "vitest";
import { correspond, delaiNouvelEssai, doitReessayer, grouperParCreneau, lignesAffichees } from "@/lib/pointage";
import type { PointageInfoResponse } from "@/types/distribution";

const marie: PointageInfoResponse = {
  inscriptionId: "i1",
  nom: "Dupont",
  prenom: "Marie-Hélène",
  type: "BENEFICIAIRE",
  statut: "CONFIRMEE",
  presence: "NON_POINTE",
  heureCreneauDebut: null,
  heureCreneauFin: null,
};

describe("lignesAffichees", () => {
  it("applique le dernier envoi en cours et signale l'attente hors ligne", () => {
    const [ligne] = lignesAffichees([marie], [
      { inscriptionId: "i1", presence: "ABSENT", statut: "success", enPause: false, soumisA: 1 },
      { inscriptionId: "i1", presence: "PRESENT", statut: "pending", enPause: true, soumisA: 2 },
    ]);
    expect(ligne.presence).toBe("PRESENT");
    expect(ligne.etat).toBe("attente");
  });

  it("rend la presence du serveur apres un echec definitif", () => {
    const [ligne] = lignesAffichees([marie], [
      { inscriptionId: "i1", presence: "PRESENT", statut: "error", enPause: false, soumisA: 1 },
    ]);
    expect(ligne.presence).toBe("NON_POINTE");
    expect(ligne.etat).toBe("echec");
    expect(ligne.derniereDemande).toBe("PRESENT");
  });
});

describe("pointage, regles d'envoi", () => {
  it("ne reessaie pas un refus du serveur, reessaie une coupure", () => {
    expect(doitReessayer(0, { status: 409 })).toBe(false);
    expect(doitReessayer(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(doitReessayer(5, new TypeError("Failed to fetch"))).toBe(false);
    expect(doitReessayer(1, { status: 503 })).toBe(true);
  });

  it("espace les essais sans depasser 15 secondes", () => {
    expect([0, 1, 2, 5].map(delaiNouvelEssai)).toEqual([1000, 2000, 4000, 15000]);
  });

  it("filtre sans tenir compte des accents ni de la casse", () => {
    expect(correspond(marie, "helene")).toBe(true);
    expect(correspond(marie, "DUP")).toBe(true);
    expect(correspond(marie, "martin")).toBe(false);
  });
});

describe("grouperParCreneau", () => {
  const ligne = (id: string, debut: string | null, fin: string | null) =>
    ({ ...marie, inscriptionId: id, heureCreneauDebut: debut, heureCreneauFin: fin, etat: null, derniereDemande: null });
  const lignes = [
    ligne("a", "17:30:00", "17:45:00"),
    ligne("b", "18:00:00", "18:15:00"),
    ligne("c", "17:45:00", "18:00:00"),
    ligne("d", "18:15:00", "18:30:00"),
    ligne("e", "18:00:00", "18:15:00"),
    ligne("f", null, null),
  ];

  it("met le creneau en cours d'abord, puis ceux a venir, puis les passes du plus recent", () => {
    const groupes = grouperParCreneau(lignes, "18:05");
    expect(groupes.map((g) => g.debut)).toEqual(["18:00", "18:15", "17:45", "17:30", null]);
    expect(groupes[0].courant).toBe(true);
    expect(groupes[0].lignes.map((l) => l.inscriptionId)).toEqual(["b", "e"]);
    expect(groupes.filter((g) => g.courant)).toHaveLength(1);
  });

  it("garde l'ordre chronologique tant que l'heure n'est pas connue", () => {
    const groupes = grouperParCreneau(lignes, null);
    expect(groupes.map((g) => g.debut)).toEqual(["17:30", "17:45", "18:00", "18:15", null]);
    expect(groupes.some((g) => g.courant)).toBe(false);
  });
});
