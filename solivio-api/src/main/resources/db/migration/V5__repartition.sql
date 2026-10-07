-- V5 : module repartition. La dotation est calculee a la demande, jamais stockee.
CREATE TABLE denree_distribution (
    id                     UUID           NOT NULL DEFAULT gen_random_uuid(),
    distribution_id        UUID           NOT NULL,
    libelle                VARCHAR(200)   NOT NULL,
    unite                  VARCHAR(20)    NOT NULL,
    nombre_contenants      INTEGER        NOT NULL,
    quantite_par_contenant NUMERIC(12, 4) NOT NULL,
    date_creation          TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT pk_denree_distribution PRIMARY KEY (id),
    CONSTRAINT fk_denree_distribution FOREIGN KEY (distribution_id) REFERENCES distribution(id) ON DELETE CASCADE,
    CONSTRAINT ck_denree_nombre_contenants CHECK (nombre_contenants > 0),
    CONSTRAINT ck_denree_quantite_par_contenant CHECK (quantite_par_contenant > 0),
    CONSTRAINT ck_denree_unite CHECK (unite IN ('UNITE', 'KILOGRAMME', 'LITRE', 'PIECE'))
);

CREATE INDEX idx_denree_distribution ON denree_distribution(distribution_id);

-- Catalogue des denrees, alimente a la saisie et gerable par les responsables.
CREATE TABLE catalogue_denree (
    id                UUID         NOT NULL DEFAULT gen_random_uuid(),
    libelle           VARCHAR(200) NOT NULL,
    date_creation     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    date_modification TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_catalogue_denree PRIMARY KEY (id)
);

-- Unicite insensible a la casse : riz et Riz sont la meme denree.
CREATE UNIQUE INDEX uq_catalogue_denree_libelle ON catalogue_denree(LOWER(libelle));
