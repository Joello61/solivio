-- RG4 : a la cloture, un beneficiaire confirme non pointe est enregistre absent.
-- La colonne distingue cette absence deduite d'une absence pointee (statistiques).
ALTER TABLE inscription ADD COLUMN absence_deduite BOOLEAN NOT NULL DEFAULT false;
