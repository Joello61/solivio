-- V4 : module inscription (inscriptions et pointage, roles benevoles, pointage ad hoc).

-- L'inscription porte aussi la presence. nom et prenom sont denormalises pour
-- que le pointage n'ait pas a lire le module identity (et jamais le profil social).
CREATE TABLE inscription (
    id                 UUID         NOT NULL DEFAULT gen_random_uuid(),
    distribution_id    UUID         NOT NULL,
    creneau_id         UUID,
    personne_id        UUID         NOT NULL,
    nom                VARCHAR(100) NOT NULL,
    prenom             VARCHAR(100) NOT NULL,
    type               VARCHAR(15)  NOT NULL,
    statut             VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMEE',
    rang_liste_attente INTEGER,
    presence           VARCHAR(15)  NOT NULL DEFAULT 'NON_POINTE',
    date_pointage      TIMESTAMPTZ,
    pointe_par_id      UUID,
    date_inscription   TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_inscription PRIMARY KEY (id),
    CONSTRAINT fk_inscription_distribution FOREIGN KEY (distribution_id) REFERENCES distribution(id) ON DELETE CASCADE,
    CONSTRAINT fk_inscription_creneau FOREIGN KEY (creneau_id) REFERENCES creneau(id),
    CONSTRAINT fk_inscription_personne FOREIGN KEY (personne_id) REFERENCES personne(id),
    CONSTRAINT fk_inscription_pointe_par FOREIGN KEY (pointe_par_id) REFERENCES personne(id),
    -- RG2 : une ligne par personne, distribution et type ; une reinscription reutilise la ligne.
    CONSTRAINT uq_inscription_distribution_personne_type UNIQUE (distribution_id, personne_id, type),
    CONSTRAINT ck_inscription_type CHECK (type IN ('BENEFICIAIRE', 'BENEVOLE')),
    CONSTRAINT ck_inscription_statut CHECK (statut IN ('CONFIRMEE', 'LISTE_ATTENTE', 'ANNULEE')),
    CONSTRAINT ck_inscription_presence CHECK (presence IN ('NON_POINTE', 'PRESENT', 'ABSENT'))
);

CREATE INDEX idx_inscription_distribution ON inscription(distribution_id);
CREATE INDEX idx_inscription_personne ON inscription(personne_id);
CREATE INDEX idx_inscription_liste_attente ON inscription(distribution_id, type, rang_liste_attente)
    WHERE statut = 'LISTE_ATTENTE';

-- Catalogue des roles benevoles sur deux niveaux (role principal, sous-type).
CREATE TABLE type_role (
    id        UUID         NOT NULL DEFAULT gen_random_uuid(),
    parent_id UUID,
    libelle   VARCHAR(200) NOT NULL,
    actif     BOOLEAN      NOT NULL DEFAULT true,

    CONSTRAINT pk_type_role PRIMARY KEY (id),
    CONSTRAINT fk_type_role_parent FOREIGN KEY (parent_id) REFERENCES type_role(id) ON DELETE CASCADE
);

CREATE INDEX idx_type_role_parent ON type_role(parent_id) WHERE parent_id IS NOT NULL;

-- Roles assignes par le coordinateur a un benevole inscrit (0..N par inscription).
CREATE TABLE role_benevole_inscription (
    id             UUID         NOT NULL DEFAULT gen_random_uuid(),
    inscription_id UUID         NOT NULL,
    type_role_id   UUID,
    libelle_libre  VARCHAR(200),

    CONSTRAINT pk_role_benevole_inscription PRIMARY KEY (id),
    CONSTRAINT fk_role_benevole_inscription FOREIGN KEY (inscription_id) REFERENCES inscription(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_benevole_type_role FOREIGN KEY (type_role_id) REFERENCES type_role(id) ON DELETE SET NULL,
    CONSTRAINT ck_role_benevole_au_moins_un CHECK (type_role_id IS NOT NULL OR libelle_libre IS NOT NULL)
);

CREATE INDEX idx_role_benevole_inscription ON role_benevole_inscription(inscription_id);

-- Visiteurs ponctuels pointes sans compte (pas de personne_id).
CREATE TABLE pointage_ad_hoc (
    id                 UUID         NOT NULL DEFAULT gen_random_uuid(),
    distribution_id    UUID         NOT NULL,
    nom                VARCHAR(100) NOT NULL,
    prenom             VARCHAR(100) NOT NULL,
    email              VARCHAR(255),
    role               VARCHAR(100),
    presence           VARCHAR(20)  NOT NULL DEFAULT 'PRESENT',
    invitation_envoyee BOOLEAN      NOT NULL DEFAULT false,
    date_pointage      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_pointage_ad_hoc PRIMARY KEY (id),
    CONSTRAINT fk_pointage_ad_hoc_distribution FOREIGN KEY (distribution_id) REFERENCES distribution(id) ON DELETE CASCADE,
    CONSTRAINT ck_presence_ad_hoc CHECK (presence IN ('PRESENT', 'ABSENT'))
);

CREATE INDEX idx_pointage_ad_hoc_distribution ON pointage_ad_hoc(distribution_id);
