-- V1 tenant: module identite-acces + audit
-- Ce script s'applique a chaque schema tenant isole.

-- Roles systeme (responsable, coordinateur, benevole, beneficiaire)
CREATE TABLE IF NOT EXISTS role (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    nom         VARCHAR(50) NOT NULL,
    est_systeme BOOLEAN     NOT NULL DEFAULT false,

    CONSTRAINT pk_role PRIMARY KEY (id),
    CONSTRAINT uq_role_nom UNIQUE (nom)
);

-- Permissions elementaires par module et action
CREATE TABLE IF NOT EXISTS permission (
    id      UUID        NOT NULL DEFAULT gen_random_uuid(),
    module  VARCHAR(50) NOT NULL,
    action  VARCHAR(50) NOT NULL,

    CONSTRAINT pk_permission PRIMARY KEY (id),
    CONSTRAINT uq_permission_module_action UNIQUE (module, action)
);

-- Association role <-> permission (n-n)
CREATE TABLE IF NOT EXISTS role_permission (
    role_id         UUID NOT NULL,
    permission_id   UUID NOT NULL,

    CONSTRAINT pk_role_permission PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permission_role       FOREIGN KEY (role_id)       REFERENCES role(id)       ON DELETE CASCADE,
    CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE
);

-- Personnes : donnees de contact, sans donnees sensibles
CREATE TABLE IF NOT EXISTS personne (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    keycloak_id      VARCHAR(36)  NOT NULL,
    nom              VARCHAR(100) NOT NULL,
    prenom           VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    telephone        VARCHAR(30),
    date_creation    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    date_suppression TIMESTAMPTZ,

    CONSTRAINT pk_personne PRIMARY KEY (id),
    CONSTRAINT uq_personne_keycloak_id UNIQUE (keycloak_id),
    CONSTRAINT uq_personne_email UNIQUE (email)
);

-- Donnees sociales sensibles, isolees de personne (acces restreint)
CREATE TABLE IF NOT EXISTS profil_beneficiaire (
    id                      UUID        NOT NULL DEFAULT gen_random_uuid(),
    personne_id             UUID        NOT NULL,
    date_naissance          DATE,
    statut_boursier         VARCHAR(20),
    echelon_bourse          SMALLINT,
    categorie_nationalite   VARCHAR(20),
    reste_a_vivre_mensuel   NUMERIC(10,2),
    niveau_academique       VARCHAR(20),
    etablissement           VARCHAR(255),
    situation_logement      VARCHAR(30),
    a_emploi_etudiant       BOOLEAN,

    CONSTRAINT pk_profil_beneficiaire PRIMARY KEY (id),
    CONSTRAINT uq_profil_beneficiaire_personne UNIQUE (personne_id),
    CONSTRAINT fk_profil_beneficiaire_personne FOREIGN KEY (personne_id) REFERENCES personne(id) ON DELETE CASCADE,
    CONSTRAINT ck_statut_boursier CHECK (statut_boursier IN ('non_boursier', 'boursier')),
    CONSTRAINT ck_categorie_nationalite CHECK (categorie_nationalite IN ('francaise', 'ressortissant_ue', 'hors_ue')),
    CONSTRAINT ck_niveau_academique CHECK (niveau_academique IN ('L1','L2','L3','M1','M2','doctorat','BTS','autre')),
    CONSTRAINT ck_situation_logement CHECK (situation_logement IN ('seul','colocation','chez_parents','residence','sans_domicile_stable','autre'))
);

-- Affiliation : lien personne <-> role dans l'association
-- unite_organisationnelle est reserve pour la hierarchie multi-antennes (V3)
CREATE TABLE IF NOT EXISTS affiliation (
    id                          UUID        NOT NULL DEFAULT gen_random_uuid(),
    personne_id                 UUID        NOT NULL,
    role_id                     UUID        NOT NULL,
    unite_organisationnelle_id  UUID,
    date_debut                  DATE        NOT NULL DEFAULT CURRENT_DATE,
    date_fin                    DATE,

    CONSTRAINT pk_affiliation PRIMARY KEY (id),
    CONSTRAINT fk_affiliation_personne FOREIGN KEY (personne_id) REFERENCES personne(id) ON DELETE CASCADE,
    CONSTRAINT fk_affiliation_role     FOREIGN KEY (role_id)     REFERENCES role(id)
);

-- Journal d'audit : actions sensibles (RGPD)
CREATE TABLE IF NOT EXISTS journal_audit (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    acteur_id       UUID,
    action          VARCHAR(100) NOT NULL,
    type_entite     VARCHAR(50)  NOT NULL,
    entite_id       UUID,
    donnees_avant   JSONB,
    donnees_apres   JSONB,
    adresse_ip      VARCHAR(45),
    date            TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_journal_audit PRIMARY KEY (id)
);

-- Donnees de reference : roles systeme par defaut
INSERT INTO role (nom, est_systeme) VALUES
    ('responsable',  true),
    ('coordinateur', true),
    ('benevole',     true),
    ('beneficiaire', true)
ON CONFLICT (nom) DO NOTHING;
