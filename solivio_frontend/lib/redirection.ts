const CHEMIN_PAR_DEFAUT = "/dashboard";

// Caracteres de controle (tabulation, retour a la ligne...) que le parseur d'URL
// supprime silencieusement, ce qui permet de deguiser "//evil.com".
const CARACTERES_DE_CONTROLE = /[\u0000-\u001f\u007f]/;

/**
 * Chemin de retour sur apres une redirection : le parametre est resolu comme le
 * ferait le navigateur, puis refuse s'il sort de l'origine de l'application.
 * Un filtre sur la chaine seule laissait passer "/\evil.com", que le parseur
 * d'URL lit comme "//evil.com".
 */
export function cheminDeRetourSur(brut: string | null, origine: string): string {
  if (!brut || !brut.startsWith("/") || brut.includes("\\") || CARACTERES_DE_CONTROLE.test(brut)) {
    return CHEMIN_PAR_DEFAUT;
  }
  let cible: URL;
  try {
    cible = new URL(brut, origine);
  } catch {
    return CHEMIN_PAR_DEFAUT;
  }
  if (cible.origin !== new URL(origine).origin) {
    return CHEMIN_PAR_DEFAUT;
  }
  return cible.pathname + cible.search;
}
