/* Message a afficher pour une erreur d'appel API : le detail du backend s'il existe. */
export function messageErreur(err: unknown, parDefaut: string): string {
  if (!(err instanceof Error)) return parDefaut;
  return (err as { detail?: string }).detail ?? err.message;
}
