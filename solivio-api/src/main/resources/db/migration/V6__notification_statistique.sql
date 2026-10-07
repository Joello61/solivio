-- V6 : modules notification et statistique.

-- Historique des notifications envoyees.
CREATE TABLE notification (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    personne_id     UUID         NOT NULL,
    distribution_id UUID,
    type_evenement  VARCHAR(35)  NOT NULL,
    canal           VARCHAR(10)  NOT NULL DEFAULT 'EMAIL',
    sujet           VARCHAR(255) NOT NULL,
    statut          VARCHAR(10)  NOT NULL,
    erreur          TEXT,
    date_envoi      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_notification PRIMARY KEY (id)
);

CREATE INDEX idx_notification_personne ON notification(personne_id);
CREATE INDEX idx_notification_distribution ON notification(distribution_id);
CREATE INDEX idx_notification_date_envoi ON notification(date_envoi);

-- Statistiques agregees par distribution, calculees a la cloture. distribution_date
-- est copiee pour filtrer par periode sans jointure sur le module distribution.
CREATE TABLE statistique_distribution (
    distribution_id           UUID          NOT NULL,
    distribution_date         DATE          NOT NULL,
    nb_inscrits_beneficiaires INT           NOT NULL DEFAULT 0,
    nb_inscrits_benevoles     INT           NOT NULL DEFAULT 0,
    nb_presents_beneficiaires INT           NOT NULL DEFAULT 0,
    nb_absents_beneficiaires  INT           NOT NULL DEFAULT 0,
    nb_non_pointes            INT           NOT NULL DEFAULT 0,
    taux_presence             NUMERIC(5, 2) NOT NULL DEFAULT 0,
    date_calcul               TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT pk_statistique_distribution PRIMARY KEY (distribution_id)
);

CREATE INDEX idx_stat_distribution_date ON statistique_distribution(distribution_date);
