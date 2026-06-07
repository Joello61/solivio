-- V6 tenant: module repartition des denrees
-- denree_distribution : saisie par distribution, dotation calculee a la demande (jamais stockee).

CREATE TABLE IF NOT EXISTS denree_distribution (
    id                      UUID            NOT NULL DEFAULT gen_random_uuid(),
    distribution_id         UUID            NOT NULL,
    libelle                 VARCHAR(200)    NOT NULL,
    unite                   VARCHAR(20)     NOT NULL,
    nombre_contenants       INTEGER         NOT NULL CHECK (nombre_contenants > 0),
    quantite_par_contenant  NUMERIC(12, 4)  NOT NULL CHECK (quantite_par_contenant > 0),
    date_creation           TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT pk_denree_distribution PRIMARY KEY (id),
    CONSTRAINT fk_denree_distribution FOREIGN KEY (distribution_id)
        REFERENCES distribution(id) ON DELETE CASCADE,
    CONSTRAINT ck_denree_unite CHECK (
        unite IN ('UNITE', 'KILOGRAMME', 'LITRE', 'PIECE')
    )
);

CREATE INDEX IF NOT EXISTS idx_denree_distribution ON denree_distribution(distribution_id);
