-- V4: codes de verification a usage unique (schema public)
-- Utilises pour : verification d'email (email_verification) et reinitialisation de mot de passe (password_reset).
-- code    : 6 chiffres generes cote serveur, expire apres 15 minutes.
-- utilise : mis a true a la premiere utilisation reussie (pas de reutilisation).
CREATE TABLE IF NOT EXISTS verification_code (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    compte_id   UUID        NOT NULL,
    code        VARCHAR(6)  NOT NULL,
    type        VARCHAR(25) NOT NULL,
    expire_a    TIMESTAMPTZ NOT NULL,
    utilise     BOOLEAN     NOT NULL DEFAULT false,
    cree_a      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_verification_code PRIMARY KEY (id),
    CONSTRAINT fk_verification_code_compte FOREIGN KEY (compte_id) REFERENCES compte(id) ON DELETE CASCADE,
    CONSTRAINT ck_verification_code_type CHECK (type IN ('email_verification', 'password_reset'))
);

CREATE INDEX IF NOT EXISTS idx_verification_code_compte_type ON verification_code(compte_id, type);
