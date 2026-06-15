CREATE TABLE evenement (
    id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    titre                    VARCHAR(200) NOT NULL,
    description              TEXT,
    type                     VARCHAR(20)  NOT NULL DEFAULT 'AUTRE',
    lieu_place_id            VARCHAR(500),
    lieu_adresse_formatee    VARCHAR(500),
    lieu_latitude            NUMERIC(10,7),
    lieu_longitude           NUMERIC(10,7),
    date_heure_debut         TIMESTAMPTZ  NOT NULL,
    date_heure_fin           TIMESTAMPTZ  NOT NULL,
    a_besoin_staff           BOOLEAN      NOT NULL DEFAULT TRUE,
    ouvert_participants      BOOLEAN      NOT NULL DEFAULT FALSE,
    public_participants      VARCHAR(20),
    mode_inscription         VARCHAR(25)  NOT NULL DEFAULT 'OBLIGATOIRE',
    capacite_staff           INTEGER,
    capacite_participants    INTEGER,
    statut                   VARCHAR(20)  NOT NULL DEFAULT 'BROUILLON',
    raison_annulation        TEXT,
    cree_par_id              UUID         NOT NULL REFERENCES personne(id),
    date_creation            TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_type_evenement    CHECK (type IN ('STAND','FETE','AUTRE')),
    CONSTRAINT ck_statut_evenement  CHECK (statut IN ('BROUILLON','PUBLIE','EN_COURS','TERMINE','ANNULE')),
    CONSTRAINT ck_public_cible      CHECK (
        public_participants IN ('BENEVOLES','BENEFICIAIRES','TOUS') OR public_participants IS NULL
    ),
    CONSTRAINT ck_mode_inscription  CHECK (mode_inscription IN ('OBLIGATOIRE','LIBRE','SANS_INSCRIPTION'))
);

CREATE TABLE participation_evenement (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    evenement_id     UUID        NOT NULL REFERENCES evenement(id),
    personne_id      UUID        NOT NULL REFERENCES personne(id),
    role             VARCHAR(20) NOT NULL DEFAULT 'PARTICIPANT',
    presence         VARCHAR(20) NOT NULL DEFAULT 'NON_POINTE',
    date_inscription TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_participation     UNIQUE (evenement_id, personne_id, role),
    CONSTRAINT ck_role_participation CHECK (role IN ('STAFF','PARTICIPANT')),
    CONSTRAINT ck_presence_evenement CHECK (presence IN ('NON_POINTE','PRESENT','ABSENT'))
);

CREATE INDEX idx_evenement_statut          ON evenement(statut);
CREATE INDEX idx_evenement_type            ON evenement(type);
CREATE INDEX idx_participation_evenement   ON participation_evenement(evenement_id);
CREATE INDEX idx_participation_personne    ON participation_evenement(personne_id);
