-- V3 : module distribution (distributions, creneaux, lieu structure Google Places).
CREATE TABLE distribution (
    id                         UUID             NOT NULL DEFAULT gen_random_uuid(),
    titre                      VARCHAR(200)     NOT NULL,
    description                TEXT,
    date                       DATE             NOT NULL,
    statut                     VARCHAR(20)      NOT NULL DEFAULT 'BROUILLON',
    capacite_beneficiaires     INTEGER          NOT NULL,
    capacite_benevoles         INTEGER,
    mode_creneau               VARCHAR(20)      NOT NULL DEFAULT 'CRENEAU_UNIQUE',
    base_repartition           VARCHAR(20)      NOT NULL DEFAULT 'INSCRITS',
    motif_annulation           TEXT,
    cree_par_id                UUID             NOT NULL,
    unite_organisationnelle_id UUID,
    lieu_place_id              VARCHAR(255),
    lieu_nom                   VARCHAR(255),
    lieu_adresse_formatee      VARCHAR(500),
    lieu_latitude              DOUBLE PRECISION,
    lieu_longitude             DOUBLE PRECISION,
    lieu_numero_rue            VARCHAR(20),
    lieu_voie                  VARCHAR(255),
    lieu_code_postal           VARCHAR(20),
    lieu_ville                 VARCHAR(100),
    date_creation              TIMESTAMPTZ      NOT NULL DEFAULT now(),

    CONSTRAINT pk_distribution PRIMARY KEY (id),
    CONSTRAINT fk_distribution_cree_par FOREIGN KEY (cree_par_id) REFERENCES personne(id),
    CONSTRAINT ck_distribution_statut CHECK (statut IN ('BROUILLON', 'PUBLIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')),
    CONSTRAINT ck_distribution_mode_creneau CHECK (mode_creneau IN ('CRENEAU_UNIQUE', 'CRENEAUX_DECOUPES')),
    CONSTRAINT ck_distribution_base_repartition CHECK (base_repartition IN ('INSCRITS', 'PRESENTS')),
    CONSTRAINT ck_distribution_capacite CHECK (capacite_beneficiaires > 0)
);

CREATE INDEX idx_distribution_date ON distribution(date);
CREATE INDEX idx_distribution_statut ON distribution(statut);

CREATE TABLE creneau (
    id              UUID    NOT NULL DEFAULT gen_random_uuid(),
    distribution_id UUID    NOT NULL,
    heure_debut     TIME    NOT NULL,
    heure_fin       TIME    NOT NULL,
    capacite        INTEGER NOT NULL,

    CONSTRAINT pk_creneau PRIMARY KEY (id),
    CONSTRAINT fk_creneau_distribution FOREIGN KEY (distribution_id) REFERENCES distribution(id) ON DELETE CASCADE,
    CONSTRAINT ck_creneau_horaire CHECK (heure_fin > heure_debut),
    CONSTRAINT ck_creneau_capacite CHECK (capacite > 0)
);

CREATE INDEX idx_creneau_distribution ON creneau(distribution_id);
