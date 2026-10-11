import { describe, expect, it } from "vitest";
import { correspond, delaiNouvelEssai, doitReessayer, lignesAffichees } from "@/lib/pointage";
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
