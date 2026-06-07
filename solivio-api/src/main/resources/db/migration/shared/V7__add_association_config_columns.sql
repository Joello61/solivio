-- V7 shared: parametres de configuration de l'association
-- Colonnes typees pour les parametres editables par le responsable.
-- frequence_max_par_semaine : null = pas de limite (RG1).

ALTER TABLE association
    ADD COLUMN IF NOT EXISTS logo_url             VARCHAR(500),
    ADD COLUMN IF NOT EXISTS couleur_primaire     VARCHAR(7)   DEFAULT '#16513F',
    ADD COLUMN IF NOT EXISTS couleur_secondaire   VARCHAR(7)   DEFAULT '#1E6B52',
    ADD COLUMN IF NOT EXISTS fuseau_horaire       VARCHAR(50)  DEFAULT 'Europe/Paris',
    ADD COLUMN IF NOT EXISTS frequence_max_par_semaine SMALLINT,
    ADD COLUMN IF NOT EXISTS contact_email        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS contact_telephone    VARCHAR(30);
