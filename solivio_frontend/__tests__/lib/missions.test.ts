import { describe, expect, it } from "vitest";
import { missionsNonPrises } from "@/lib/missions";

describe("missionsNonPrises", () => {
  it("garde les missions libres de la semaine qui vient, la plus proche d'abord", () => {
    const maintenant = new Date("2026-10-15T10:00:00Z");
    const missions = [
      { id: "loin", statut: "DISPONIBLE" as const, dateHeure: "2026-10-30T10:00:00Z" },
      { id: "prise", statut: "PRISE_EN_CHARGE" as const, dateHeure: "2026-10-16T10:00:00Z" },
      { id: "passee", statut: "DISPONIBLE" as const, dateHeure: "2026-10-14T10:00:00Z" },
      { id: "samedi", statut: "DISPONIBLE" as const, dateHeure: "2026-10-17T10:00:00Z" },
      { id: "demain", statut: "DISPONIBLE" as const, dateHeure: "2026-10-16T08:00:00Z" },
    ];
    expect(missionsNonPrises(missions, maintenant).map((m) => m.id)).toEqual(["demain", "samedi"]);
  });
});
