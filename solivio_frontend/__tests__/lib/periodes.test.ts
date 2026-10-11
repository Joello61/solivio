import { describe, expect, it } from "vitest";
import { lirePeriode, periodePredefinie } from "@/lib/periodes";

const le15Mars = new Date(2026, 2, 15);

describe("periodes", () => {
  it("calcule les periodes predefinies", () => {
    expect(periodePredefinie("mois", le15Mars)).toEqual({ debut: "2026-03-01", fin: "2026-03-31" });
    expect(periodePredefinie("mois-precedent", le15Mars)).toEqual({ debut: "2026-02-01", fin: "2026-02-28" });
    expect(periodePredefinie("trimestre", le15Mars)).toEqual({ debut: "2026-01-01", fin: "2026-03-31" });
    expect(periodePredefinie("annee", le15Mars)).toEqual({ debut: "2026-01-01", fin: "2026-12-31" });
  });

  it("passe a l'annee precedente en janvier", () => {
    expect(periodePredefinie("mois-precedent", new Date(2026, 0, 10))).toEqual({ debut: "2025-12-01", fin: "2025-12-31" });
  });

  it("garde une periode valide de l'URL et ignore une periode invalide", () => {
    expect(lirePeriode("2026-01-05", "2026-02-10", le15Mars)).toEqual({ debut: "2026-01-05", fin: "2026-02-10" });
    expect(lirePeriode("2026-02-10", "2026-01-05", le15Mars)).toEqual({ debut: "2026-03-01", fin: "2026-03-31" });
    expect(lirePeriode("hier", undefined, le15Mars)).toEqual({ debut: "2026-03-01", fin: "2026-03-31" });
  });
});
