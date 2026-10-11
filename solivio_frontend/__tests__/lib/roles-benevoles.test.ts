import { describe, expect, it } from "vitest";
import { rolesAttribuables } from "@/lib/roles-benevoles";

describe("rolesAttribuables", () => {
  it("garde les roles actifs et prefixe les sous-roles", () => {
    expect(
      rolesAttribuables([
        {
          id: "a",
          parentId: null,
          libelle: "Accueil",
          actif: true,
          sousTypes: [
            { id: "b", parentId: "a", libelle: "Badges", actif: true, sousTypes: [] },
            { id: "c", parentId: "a", libelle: "Ancien", actif: false, sousTypes: [] },
          ],
        },
        { id: "d", parentId: null, libelle: "Archive", actif: false, sousTypes: [] },
      ]),
    ).toEqual([
      { id: "a", libelle: "Accueil" },
      { id: "b", libelle: "Accueil - Badges" },
    ]);
  });
});
