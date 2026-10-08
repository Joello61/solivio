-- V1 : module identity (comptes, personnes, membres, jetons, invitations) et audit.
-- Schema unique : Solivio sert une seule association (ADR-001).

-- Identite de connexion. password_hash est nul pour un compte Google seul,
-- google_id est nul pour un compte email et mot de passe seul.
CREATE TABLE compte (
    id                UUID         NOT NULL DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL,
    password_hash     VARCHAR(255),
    google_id         VARCHAR(255),
    nom               VARCHAR(100) NOT NULL,
    prenom            VARCHAR(100) NOT NULL,
    photo_url         VARCHAR(500),
    email_verifie     BOOLEAN      NOT NULL DEFAULT false,
    actif             BOOLEAN      NOT NULL DEFAULT true,
    is_super_admin    BOOLEAN      NOT NULL DEFAULT false,
    date_creation     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    date_modification TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_compte PRIMARY KEY (id),
    CONSTRAINT uq_compte_email UNIQUE (email),
    CONSTRAINT uq_compte_google_id UNIQUE (google_id),
    CONSTRAINT ck_compte_credentials CHECK (password_hash IS NOT NULL OR google_id IS NOT NULL)
);

-- Role du compte dans l'association. Un compte a au plus un role.
-- coordo_type : sous-type libre pour les coordinateurs (ex : coordo_sec).
CREATE TABLE membre (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    compte_id   UUID        NOT NULL,
    role        VARCHAR(30) NOT NULL,
    coordo_type VARCHAR(50),
    statut      VARCHAR(25) NOT NULL DEFAULT 'actif',
    invite_par  UUID,
    date_debut  DATE        NOT NULL DEFAULT CURRENT_DATE,
    date_fin    DATE,

    CONSTRAINT pk_membre PRIMARY KEY (id),
    CONSTRAINT uq_membre_compte UNIQUE (compte_id),
    CONSTRAINT fk_membre_compte FOREIGN KEY (compte_id) REFERENCES compte(id) ON DELETE CASCADE,
    CONSTRAINT fk_membre_invite_par FOREIGN KEY (invite_par) REFERENCES compte(id) ON DELETE SET NULL,
    CONSTRAINT ck_membre_role CHECK (role IN (
        'admin', 'responsable', 'coordinateur', 'benevole', 'beneficiaire'
    )),
    CONSTRAINT ck_membre_statut CHECK (statut IN ('actif', 'suspendu', 'invite_en_attente'))
);

CREATE INDEX idx_membre_role ON membre(role) WHERE statut = 'actif';

-- Donnees de contact metier, sans donnees sensibles. compte_email suit l'email
-- du compte (ON UPDATE CASCADE) ; la personne survit a la suppression du compte
-- pour conserver l'historique des inscriptions.
CREATE TABLE personne (
    id               UUID         NOT NULL DEFAULT gen_random_uuid(),
    compte_email     VARCHAR(255),
    nom              VARCHAR(100) NOT NULL,
    prenom           VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL,
    telephone        VARCHAR(30),
    photo_url        VARCHAR(500),
    date_creation    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    date_suppression TIMESTAMPTZ,

    CONSTRAINT pk_personne PRIMARY KEY (id),
    CONSTRAINT uq_personne_email UNIQUE (email),
    CONSTRAINT uq_personne_compte_email UNIQUE (compte_email),
    CONSTRAINT fk_personne_compte FOREIGN KEY (compte_email) REFERENCES compte(email)
        ON UPDATE CASCADE ON DELETE SET NULL
);

-- Donnees sociales sensibles, isolees de personne (acces restreint).
CREATE TABLE profil_beneficiaire (
    id                    UUID        NOT NULL DEFAULT gen_random_uuid(),
    personne_id           UUID        NOT NULL,
    date_naissance        DATE,
    statut_boursier       VARCHAR(20),
    echelon_bourse        SMALLINT,
    categorie_nationalite VARCHAR(20),
    reste_a_vivre_mensuel NUMERIC(10, 2),
    niveau_academique     VARCHAR(20),
    etablissement         VARCHAR(255),
    situation_logement    VARCHAR(30),
    a_emploi_etudiant     BOOLEAN,

    CONSTRAINT pk_profil_beneficiaire PRIMARY KEY (id),
    CONSTRAINT uq_profil_beneficiaire_personne UNIQUE (personne_id),
    CONSTRAINT fk_profil_beneficiaire_personne FOREIGN KEY (personne_id) REFERENCES personne(id) ON DELETE CASCADE,
    CONSTRAINT ck_statut_boursier CHECK (statut_boursier IN ('non_boursier', 'boursier')),
    CONSTRAINT ck_categorie_nationalite CHECK (categorie_nationalite IN ('francaise', 'ressortissant_ue', 'hors_ue')),
    CONSTRAINT ck_niveau_academique CHECK (niveau_academique IN ('L1', 'L2', 'L3', 'M1', 'M2', 'doctorat', 'BTS', 'autre')),
    CONSTRAINT ck_situation_logement CHECK (situation_logement IN (
        'seul', 'colocation', 'chez_parents', 'residence', 'sans_domicile_stable', 'autre'
    ))
);

-- Jetons de rafraichissement : seul le hash SHA-256 est stocke, rotation a chaque usage.
CREATE TABLE refresh_token (
    id         UUID         NOT NULL DEFAULT gen_random_uuid(),
    compte_id  UUID         NOT NULL,
    token_hash VARCHAR(64)  NOT NULL,
    user_agent VARCHAR(512),
    ip_address VARCHAR(45),
    expire_a   TIMESTAMPTZ  NOT NULL,
    revoque    BOOLEAN      NOT NULL DEFAULT false,
    long_duree BOOLEAN      NOT NULL DEFAULT true,
    cree_a     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_refresh_token PRIMARY KEY (id),
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_token_compte FOREIGN KEY (compte_id) REFERENCES compte(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_token_compte ON refresh_token(compte_id);
CREATE INDEX idx_refresh_token_expire ON refresh_token(expire_a);

-- Codes a usage unique (verification d'email, reinitialisation de mot de passe).
CREATE TABLE verification_code (
    id        UUID        NOT NULL DEFAULT gen_random_uuid(),
    compte_id UUID        NOT NULL,
    code      VARCHAR(6)  NOT NULL,
    type      VARCHAR(25) NOT NULL,
    expire_a  TIMESTAMPTZ NOT NULL,
    utilise   BOOLEAN     NOT NULL DEFAULT false,
    cree_a    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_verification_code PRIMARY KEY (id),
    CONSTRAINT fk_verification_code_compte FOREIGN KEY (compte_id) REFERENCES compte(id) ON DELETE CASCADE,
    CONSTRAINT ck_verification_code_type CHECK (type IN ('email_verification', 'password_reset'))
);

CREATE INDEX idx_verification_code_compte_type ON verification_code(compte_id, type);

-- Invitations a rejoindre l'association avec un role. Une seule invitation
-- en attente par email ; les invitations acceptees ou expirees restent en historique.
CREATE TABLE invitation (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    role        VARCHAR(30)  NOT NULL,
    coordo_type VARCHAR(50),
    invite_par  UUID         NOT NULL,
    token       UUID         NOT NULL DEFAULT gen_random_uuid(),
    statut      VARCHAR(20)  NOT NULL DEFAULT 'pending',
    expire_a    TIMESTAMPTZ  NOT NULL,
    cree_a      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_invitation PRIMARY KEY (id),
    CONSTRAINT uq_invitation_token UNIQUE (token),
    CONSTRAINT fk_invitation_invite_par FOREIGN KEY (invite_par) REFERENCES compte(id) ON DELETE CASCADE,
    CONSTRAINT ck_invitation_role CHECK (role IN ('admin', 'responsable', 'coordinateur', 'benevole')),
    CONSTRAINT ck_invitation_statut CHECK (statut IN ('pending', 'accepted', 'expired'))
);

CREATE UNIQUE INDEX uq_invitation_email_en_attente ON invitation(email) WHERE statut = 'pending';
CREATE INDEX idx_invitation_email ON invitation(email);

-- Journal d'audit des actions sensibles (RGPD).
CREATE TABLE journal_audit (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    acteur_id     UUID,
    action        VARCHAR(100) NOT NULL,
    type_entite   VARCHAR(50)  NOT NULL,
    entite_id     UUID,
    donnees_avant JSONB,
    donnees_apres JSONB,
    adresse_ip    VARCHAR(45),
    date          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_journal_audit PRIMARY KEY (id)
);
