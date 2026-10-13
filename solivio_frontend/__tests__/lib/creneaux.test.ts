import { describe, expect, it } from "vitest";
import { genererCreneaux } from "@/lib/creneaux";

describe("genererCreneaux", () => {
  it("decoupe la plage en creneaux consecutifs", () => {
    expect(genererCreneaux("10:00", "11:00", 15, 5)).toEqual([
      { heureDebut: "10:00", heureFin: "10:15", capacite: 5 },
      { heureDebut: "10:15", heureFin: "10:30", capacite: 5 },
      { heureDebut: "10:30", heureFin: "10:45", capacite: 5 },
      { heureDebut: "10:45", heureFin: "11:00", capacite: 5 },
    ]);
  });

  it("ignore un dernier creneau incomplet", () => {
    expect(genererCreneaux("17:00", "17:50", 20, 3).map((c) => c.heureFin)).toEqual(["17:20", "17:40"]);
  });

  it("ne genere rien sur une plage ou une capacite invalide", () => {
    expect(genererCreneaux("12:00", "10:00", 15, 5)).toEqual([]);
    expect(genererCreneaux("10:00", "12:00", 15, 0)).toEqual([]);
    expect(genererCreneaux("", "12:00", 15, 5)).toEqual([]);
  });
});
