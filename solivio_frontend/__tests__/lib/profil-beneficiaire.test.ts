import { describe, expect, it } from "vitest";
import { SITUATIONS_LOGEMENT, libelle } from "@/lib/profil-beneficiaire";

describe("libelle", () => {
  it("traduit une valeur du dossier et signale une valeur absente", () => {
    expect(libelle(SITUATIONS_LOGEMENT, "residence")).toBe("Résidence universitaire");
    expect(libelle(SITUATIONS_LOGEMENT, null)).toBe("Non renseigné");
    expect(libelle(SITUATIONS_LOGEMENT, "inconnue")).toBe("inconnue");
  });
});
