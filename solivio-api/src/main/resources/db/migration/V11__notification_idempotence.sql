-- Cle d'idempotence d'une notification (ADR-003) : un evenement rejoue ou relance
-- ne renvoie pas un email deja parti. Colonne nullable pour les emails libres et
-- les lignes existantes ; migration additive, compatible avec docker-rollout (ADR-010).
ALTER TABLE notification ADD COLUMN cle_idempotence VARCHAR(200);

CREATE UNIQUE INDEX uq_notification_envoyee ON notification(cle_idempotence, personne_id)
    WHERE statut = 'ENVOYE' AND cle_idempotence IS NOT NULL;
