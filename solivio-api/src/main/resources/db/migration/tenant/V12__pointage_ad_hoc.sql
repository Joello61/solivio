-- V12 tenant: visiteurs ponctuels au pointage sans compte existant
-- Separee de inscription car pas de personne_id (pas de compte dans l'asso).
-- invitation_envoyee permet de declencher l'invitation Solivio plus tard via le email.

CREATE TABLE pointage_ad_hoc (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    distribution_id     UUID        NOT NULL,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    email               VARCHAR(255),
    role                VARCHAR(100),
    presence            VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    invitation_envoyee  BOOLEAN     NOT NULL DEFAULT FALSE,
    date_pointage       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_pointage_ad_hoc PRIMARY KEY (id),
    CONSTRAINT fk_pointage_ad_hoc_distribution FOREIGN KEY (distribution_id)
        REFERENCES distribution(id) ON DELETE CASCADE,
    CONSTRAINT ck_presence_ad_hoc CHECK (presence IN ('PRESENT','ABSENT'))
);

CREATE INDEX idx_pointage_ad_hoc_distribution ON pointage_ad_hoc(distribution_id);
