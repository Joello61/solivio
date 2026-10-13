import { describe, expect, it } from "vitest";
import { estAVenir } from "@/lib/mes-inscriptions";

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
