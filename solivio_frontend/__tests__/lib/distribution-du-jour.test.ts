import { describe, expect, it } from "vitest";
import { distributionsDuJour, jourAssociation } from "@/lib/distribution-du-jour";
import type { DistributionResponse } from "@/types/distribution";

const d = (id: string, date: string, statut: DistributionResponse["statut"]) =>
  ({ id, date, statut, titre: id, creneaux: [], lieu: null }) as unknown as DistributionResponse;

const liste = [
  d("publiee", "2026-10-11", "PUBLIEE"),
  d("en-cours", "2026-10-11", "EN_COURS"),
  d("demain", "2026-10-12", "PUBLIEE"),
  d("terminee", "2026-10-11", "TERMINEE"),
];

describe("distributionsDuJour", () => {
  it("garde les distributions du jour, en cours d'abord", () => {
    expect(distributionsDuJour(liste, "2026-10-11").map((x) => x.id)).toEqual(["en-cours", "publiee"]);
  });

  it("calcule le jour dans le fuseau de l'association", () => {
    // 23 h 30 UTC le 10 octobre : deja le 11 a Paris.
    expect(jourAssociation(new Date("2026-10-10T23:30:00Z"))).toBe("2026-10-11");
  });
});
