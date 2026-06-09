-- V3: tokens de rafraichissement JWT (schema public)
-- Un token par session/appareil. Rotation a chaque utilisation.
-- token_hash : SHA-256 du token en clair (le token en clair ne quitte jamais le serveur).
-- revoque    : mis a true lors du logout ou d'une rotation invalide (detecction de reutilisation).
CREATE TABLE IF NOT EXISTS refresh_token (
    id           UUID         NOT NULL DEFAULT gen_random_uuid(),
    compte_id    UUID         NOT NULL,
    token_hash   VARCHAR(64)  NOT NULL,
    tenant_slug  VARCHAR(63),
    user_agent   VARCHAR(512),
    ip_address   VARCHAR(45),
    expire_a     TIMESTAMPTZ  NOT NULL,
    revoque      BOOLEAN      NOT NULL DEFAULT false,
    cree_a       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_refresh_token PRIMARY KEY (id),
    CONSTRAINT uq_refresh_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_refresh_token_compte FOREIGN KEY (compte_id) REFERENCES compte(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_compte ON refresh_token(compte_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expire ON refresh_token(expire_a);
