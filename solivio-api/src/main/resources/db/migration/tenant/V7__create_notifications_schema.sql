CREATE TABLE notification (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    personne_id     UUID        NOT NULL,
    distribution_id UUID,
    type_evenement  VARCHAR(35) NOT NULL,
    canal           VARCHAR(10) NOT NULL DEFAULT 'EMAIL',
    sujet           VARCHAR(255) NOT NULL,
    statut          VARCHAR(10) NOT NULL,
    erreur          TEXT,
    date_envoi      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_notification PRIMARY KEY (id)
);

CREATE INDEX idx_notification_personne     ON notification(personne_id);
CREATE INDEX idx_notification_distribution ON notification(distribution_id);
CREATE INDEX idx_notification_date_envoi   ON notification(date_envoi);
