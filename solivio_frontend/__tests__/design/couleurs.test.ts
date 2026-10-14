import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// DESIGN.md : les composants n'utilisent que les tokens semantiques de globals.css.
const PALETTES = "white|black|slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|neutral|coral";
const CLASSE_BRUTE = new RegExp(`(?<![\\w-])(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline)-(?:${PALETTES})(?:-\\d+)?\\b`);
const COULEUR_LITTERALE = /#[0-9a-fA-F]{3,8}\b|oklch\(|rgba?\(/;
// Logo Google (couleurs imposees par la marque) et couleurs par defaut de
// l'association (donnees configurables, pas du style).
const EXCEPTIONS_LITTERALES = new Set([
  "app/login/page.tsx",
  "app/register/page.tsx",
  "components/association/FormulaireConfiguration.tsx",
]);

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.tsx?$/.test(nom) ? [chemin] : [];
  });
}

const sources = [...fichiers("app"), ...fichiers("components")];

describe("couleurs", () => {
  it("n'utilise aucune classe de palette brute", () => {
    const fautes = sources.flatMap((f) =>
      readFileSync(f, "utf8").split("\n")
        .filter((ligne) => CLASSE_BRUTE.test(ligne))
        .map((ligne) => `${f}: ${ligne.trim()}`),
    );
    expect(fautes).toEqual([]);
  });

  it("n'ecrit aucune couleur litterale hors exceptions", () => {
    const fautes = sources
      .filter((f) => !EXCEPTIONS_LITTERALES.has(f))
      .flatMap((f) => readFileSync(f, "utf8").split("\n")
        .filter((ligne) => COULEUR_LITTERALE.test(ligne))
        .map((ligne) => `${f}: ${ligne.trim()}`));
    expect(fautes).toEqual([]);
  });

  // DESIGN.md : aucun texte sous 13 px. L'echelle Tailwind (text-xs = 13 px) suffit.
  it("n'utilise aucune taille de texte arbitraire en pixels", () => {
    const fautes = sources.flatMap((f) =>
      readFileSync(f, "utf8").split("\n")
        .filter((ligne) => /text-\[\d+(\.\d+)?px\]/.test(ligne))
        .map((ligne) => `${f}: ${ligne.trim()}`),
    );
    expect(fautes).toEqual([]);
  });
});
