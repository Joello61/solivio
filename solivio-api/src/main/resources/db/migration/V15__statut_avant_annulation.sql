-- Reactivation d'une distribution annulee par erreur : la distribution retrouve son
-- statut (brouillon ou publiee), et les inscriptions que l'annulation avait supprimees
-- retrouvent le leur (confirmee ou liste d'attente).
ALTER TABLE distribution ADD COLUMN statut_avant_annulation VARCHAR(20);
ALTER TABLE inscription ADD COLUMN statut_avant_annulation VARCHAR(20);
