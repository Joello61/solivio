-- V7 : modules reconditionnement, collecte et evenement.

CREATE TABLE session_reconditionnement (
    id                    UUID             NOT NULL DEFAULT gen_random_uuid(),
    titre                 VARCHAR(200)     NOT NULL,
    description           TEXT,
    lieu_place_id         VARCHAR(255),
    lieu_nom              VARCHAR(255),
    lieu_adresse_formatee VARCHAR(500),
    lieu_latitude         DOUBLE PRECISION,
    lieu_longitude        DOUBLE PRECISION,
    lieu_numero_rue       VARCHAR(20),
    lieu_voie             VARCHAR(255),
    lieu_code_postal      VARCHAR(20),
    lieu_ville            VARCHAR(100),
    date_heure_debut      TIMESTAMPTZ      NOT NULL,
    date_heure_fin        TIMESTAMPTZ      NOT NULL,
    capacite              INTEGER,
    statut                VARCHAR(20)      NOT NULL DEFAULT 'BROUILLON',
    motif_annulation      TEXT,
    cree_par_id           UUID             NOT NULL,
    date_creation         TIMESTAMPTZ      NOT NULL DEFAULT now(),

    CONSTRAINT pk_session_reconditionnement PRIMARY KEY (id),
    CONSTRAINT fk_session_reco_cree_par FOREIGN KEY (cree_par_id) REFERENCES personne(id),
    CONSTRAINT ck_statut_session_reco CHECK (statut IN ('BROUILLON', 'PUBLIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'))
);

CREATE TABLE inscription_reconditionnement (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    session_id       UUID        NOT NULL,
    personne_id      UUID        NOT NULL,
    statut           VARCHAR(20) NOT NULL DEFAULT 'CONFIRMEE',
    presence         VARCHAR(20) NOT NULL DEFAULT 'NON_POINTE',
    date_inscription TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_inscription_reconditionnement PRIMARY KEY (id),
    CONSTRAINT fk_inscription_reco_session FOREIGN KEY (session_id) REFERENCES session_reconditionnement(id),
    CONSTRAINT fk_inscription_reco_personne FOREIGN KEY (personne_id) REFERENCES personne(id),
    CONSTRAINT uq_inscription_reconditionnement UNIQUE (session_id, personne_id),
    CONSTRAINT ck_statut_inscription_reco CHECK (statut IN ('CONFIRMEE', 'ANNULEE')),
    CONSTRAINT ck_presence_reco CHECK (presence IN ('NON_POINTE', 'PRESENT', 'ABSENT'))
);

CREATE TABLE mission_collecte (
    id                      UUID          NOT NULL DEFAULT gen_random_uuid(),
    titre                   VARCHAR(200)  NOT NULL,
    description             TEXT,
    lieu_collecte_place_id  VARCHAR(500),
    lieu_collecte_adresse   VARCHAR(500),
    lieu_collecte_latitude  NUMERIC(10, 7),
    lieu_collecte_longitude NUMERIC(10, 7),
    lieu_depot_place_id     VARCHAR(500),
    lieu_depot_adresse      VARCHAR(500),
    lieu_depot_latitude     NUMERIC(10, 7),
    lieu_depot_longitude    NUMERIC(10, 7),
    date_heure              TIMESTAMPTZ   NOT NULL,
    capacite_personnes      INTEGER       NOT NULL DEFAULT 6,
    statut                  VARCHAR(30)   NOT NULL DEFAULT 'DISPONIBLE',
    benevole_id             UUID,
    date_prise_en_charge    TIMESTAMPTZ,
    date_collecte_effectuee TIMESTAMPTZ,
    date_depot_valide       TIMESTAMPTZ,
    annulee_par             UUID,
    raison_annulation       TEXT,
    cree_par_id             UUID          NOT NULL,
    date_creation           TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_mission_collecte PRIMARY KEY (id),
    CONSTRAINT fk_mission_benevole FOREIGN KEY (benevole_id) REFERENCES personne(id),
    CONSTRAINT fk_mission_annulee_par FOREIGN KEY (annulee_par) REFERENCES personne(id),
    CONSTRAINT fk_mission_cree_par FOREIGN KEY (cree_par_id) REFERENCES personne(id),
    CONSTRAINT ck_statut_mission CHECK (statut IN (
        'DISPONIBLE', 'PRISE_EN_CHARGE', 'COLLECTE_EFFECTUEE', 'DEPOT_VALIDE', 'ANNULEE'
    ))
);

CREATE INDEX idx_mission_collecte_statut ON mission_collecte(statut);
CREATE INDEX idx_mission_collecte_benevole ON mission_collecte(benevole_id);

CREATE TABLE evenement (
    id                    UUID          NOT NULL DEFAULT gen_random_uuid(),
    titre                 VARCHAR(200)  NOT NULL,
    description           TEXT,
    type                  VARCHAR(20)   NOT NULL DEFAULT 'AUTRE',
    lieu_place_id         VARCHAR(500),
    lieu_adresse_formatee VARCHAR(500),
    lieu_latitude         NUMERIC(10, 7),
    lieu_longitude        NUMERIC(10, 7),
    date_heure_debut      TIMESTAMPTZ   NOT NULL,
    date_heure_fin        TIMESTAMPTZ   NOT NULL,
    a_besoin_staff        BOOLEAN       NOT NULL DEFAULT true,
    ouvert_participants   BOOLEAN       NOT NULL DEFAULT false,
    public_participants   VARCHAR(20),
    mode_inscription      VARCHAR(25)   NOT NULL DEFAULT 'OBLIGATOIRE',
    capacite_staff        INTEGER,
    capacite_participants INTEGER,
    statut                VARCHAR(20)   NOT NULL DEFAULT 'BROUILLON',
    raison_annulation     TEXT,
    cree_par_id           UUID          NOT NULL,
    date_creation         TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_evenement PRIMARY KEY (id),
    CONSTRAINT fk_evenement_cree_par FOREIGN KEY (cree_par_id) REFERENCES personne(id),
    CONSTRAINT ck_type_evenement CHECK (type IN ('STAND', 'FETE', 'AUTRE')),
    CONSTRAINT ck_statut_evenement CHECK (statut IN ('BROUILLON', 'PUBLIE', 'EN_COURS', 'TERMINE', 'ANNULE')),
    CONSTRAINT ck_public_cible CHECK (
        public_participants IS NULL OR public_participants IN ('BENEVOLES', 'BENEFICIAIRES', 'TOUS')
    ),
    CONSTRAINT ck_mode_inscription CHECK (mode_inscription IN ('OBLIGATOIRE', 'LIBRE', 'SANS_INSCRIPTION'))
);

CREATE TABLE participation_evenement (
    id               UUID        NOT NULL DEFAULT gen_random_uuid(),
    evenement_id     UUID        NOT NULL,
    personne_id      UUID        NOT NULL,
    role             VARCHAR(20) NOT NULL DEFAULT 'PARTICIPANT',
    presence         VARCHAR(20) NOT NULL DEFAULT 'NON_POINTE',
    date_inscription TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_participation_evenement PRIMARY KEY (id),
    CONSTRAINT fk_participation_evenement FOREIGN KEY (evenement_id) REFERENCES evenement(id),
    CONSTRAINT fk_participation_personne FOREIGN KEY (personne_id) REFERENCES personne(id),
    CONSTRAINT uq_participation UNIQUE (evenement_id, personne_id, role),
    CONSTRAINT ck_role_participation CHECK (role IN ('STAFF', 'PARTICIPANT')),
    CONSTRAINT ck_presence_evenement CHECK (presence IN ('NON_POINTE', 'PRESENT', 'ABSENT'))
);

CREATE INDEX idx_evenement_statut ON evenement(statut);
CREATE INDEX idx_evenement_type ON evenement(type);
CREATE INDEX idx_participation_evenement ON participation_evenement(evenement_id);
CREATE INDEX idx_participation_personne ON participation_evenement(personne_id);
