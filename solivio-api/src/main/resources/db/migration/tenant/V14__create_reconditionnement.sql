CREATE TABLE session_reconditionnement (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    titre                VARCHAR(200) NOT NULL,
    description          TEXT,
    lieu_place_id        VARCHAR(255),
    lieu_nom             VARCHAR(255),
    lieu_adresse_formatee VARCHAR(500),
    lieu_latitude        DOUBLE PRECISION,
    lieu_longitude       DOUBLE PRECISION,
    lieu_numero_rue      VARCHAR(20),
    lieu_voie            VARCHAR(255),
    lieu_code_postal     VARCHAR(20),
    lieu_ville           VARCHAR(100),
    date_heure_debut     TIMESTAMPTZ  NOT NULL,
    date_heure_fin       TIMESTAMPTZ  NOT NULL,
    capacite             INTEGER,
    statut               VARCHAR(20)  NOT NULL DEFAULT 'BROUILLON',
    motif_annulation     TEXT,
    cree_par_id          UUID         NOT NULL REFERENCES personne(id),
    date_creation        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_statut_session_reco CHECK (
        statut IN ('BROUILLON', 'PUBLIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE')
    )
);

CREATE TABLE inscription_reconditionnement (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID        NOT NULL REFERENCES session_reconditionnement(id),
    personne_id     UUID        NOT NULL REFERENCES personne(id),
    statut          VARCHAR(20) NOT NULL DEFAULT 'CONFIRMEE',
    presence        VARCHAR(20) NOT NULL DEFAULT 'NON_POINTE',
    date_inscription TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_inscription_reconditionnement UNIQUE (session_id, personne_id),
    CONSTRAINT ck_statut_inscription_reco CHECK (statut IN ('CONFIRMEE', 'ANNULEE')),
    CONSTRAINT ck_presence_reco CHECK (presence IN ('NON_POINTE', 'PRESENT', 'ABSENT'))
);
