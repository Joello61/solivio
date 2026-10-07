-- V2 : configuration de l'association. Une seule ligne, garantie par la colonne
-- singleton (ADR-001) ; elle est creee ici et seulement modifiee ensuite.
CREATE TABLE association (
    id                        UUID         NOT NULL DEFAULT gen_random_uuid(),
    singleton                 BOOLEAN      NOT NULL DEFAULT true,
    nom                       VARCHAR(255) NOT NULL,
    logo_url                  VARCHAR(500),
    couleur_primaire          VARCHAR(7)   NOT NULL DEFAULT '#16513F',
    couleur_secondaire        VARCHAR(7)   NOT NULL DEFAULT '#1E6B52',
    fuseau_horaire            VARCHAR(50)  NOT NULL DEFAULT 'Europe/Paris',
    frequence_max_par_semaine INTEGER,
    contact_email             VARCHAR(255),
    contact_telephone         VARCHAR(30),
    date_creation             TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_association PRIMARY KEY (id),
    CONSTRAINT uq_association_singleton UNIQUE (singleton),
    CONSTRAINT ck_association_singleton CHECK (singleton),
    CONSTRAINT ck_association_frequence CHECK (frequence_max_par_semaine IS NULL OR frequence_max_par_semaine > 0)
);

INSERT INTO association (nom) VALUES ('Linkee Toulouse');
