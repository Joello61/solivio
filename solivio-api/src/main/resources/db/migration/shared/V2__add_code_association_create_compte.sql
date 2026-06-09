-- V2: ajout du code association + tables d'authentification custom (schema public)

-- Code unique saisi par le beneficiaire pour rejoindre une association.
-- Distinct du slug (URL-friendly) : le code est court, memorisable, souvent
-- distribue sur des flyers ou la page de l'asso.
ALTER TABLE association
    ADD COLUMN IF NOT EXISTS code VARCHAR(20);

UPDATE association SET code = UPPER(slug) WHERE code IS NULL;

ALTER TABLE association
    ALTER COLUMN code SET NOT NULL,
    ADD CONSTRAINT uq_association_code UNIQUE (code);

-- Identite unifiee : un seul compte pour tous les tenants de l'utilisateur.
-- password_hash : null pour les comptes crees via Google uniquement.
-- google_id     : null pour les comptes email/mdp uniquement.
-- is_super_admin: administrateur de la plateforme entiere (hors tenant).
CREATE TABLE IF NOT EXISTS compte (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    email            VARCHAR(255) NOT NULL,
    password_hash    VARCHAR(255),
    google_id        VARCHAR(255),
    nom              VARCHAR(100) NOT NULL,
    prenom           VARCHAR(100) NOT NULL,
    email_verifie    BOOLEAN      NOT NULL DEFAULT false,
    actif            BOOLEAN      NOT NULL DEFAULT true,
    is_super_admin   BOOLEAN      NOT NULL DEFAULT false,
    date_creation    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    date_modification TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_compte PRIMARY KEY (id),
    CONSTRAINT uq_compte_email UNIQUE (email),
    CONSTRAINT uq_compte_google_id UNIQUE (google_id),
    CONSTRAINT ck_compte_credentials CHECK (
        password_hash IS NOT NULL OR google_id IS NOT NULL
    )
);

-- Lien compte <-> association <-> role.
-- Un utilisateur peut appartenir a plusieurs associations avec des roles differents.
-- coordo_type : sous-type libre pour le role coordinateur (ex: coordo_sec, coordo_fruit).
-- statut      : actif / suspendu / invite_en_attente.
CREATE TABLE IF NOT EXISTS affiliation (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    compte_id       UUID        NOT NULL,
    association_id  UUID        NOT NULL,
    role            VARCHAR(30) NOT NULL,
    coordo_type     VARCHAR(50),
    statut          VARCHAR(25) NOT NULL DEFAULT 'actif',
    invite_par      UUID,
    date_debut      DATE        NOT NULL DEFAULT CURRENT_DATE,
    date_fin        DATE,

    CONSTRAINT pk_affiliation PRIMARY KEY (id),
    CONSTRAINT uq_affiliation_compte_asso UNIQUE (compte_id, association_id),
    CONSTRAINT fk_affiliation_compte      FOREIGN KEY (compte_id)      REFERENCES compte(id)      ON DELETE CASCADE,
    CONSTRAINT fk_affiliation_asso        FOREIGN KEY (association_id) REFERENCES association(id) ON DELETE CASCADE,
    CONSTRAINT fk_affiliation_invite_par  FOREIGN KEY (invite_par)     REFERENCES compte(id)      ON DELETE SET NULL,
    CONSTRAINT ck_affiliation_role        CHECK (role IN (
        'super_admin', 'admin', 'responsable', 'coordinateur', 'benevole', 'beneficiaire'
    )),
    CONSTRAINT ck_affiliation_statut CHECK (statut IN (
        'actif', 'suspendu', 'invite_en_attente'
    ))
);
