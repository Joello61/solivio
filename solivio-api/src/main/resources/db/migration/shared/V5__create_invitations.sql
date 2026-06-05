-- V5: invitations a rejoindre une association avec un role specifique (schema public)
-- token    : UUID genere une seule fois, envoye par email, expire apres 7 jours.
-- statut   : pending -> accepted (ou expired cote applicatif).
CREATE TABLE IF NOT EXISTS invitation (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    association_id  UUID        NOT NULL,
    role            VARCHAR(30) NOT NULL,
    coordo_type     VARCHAR(50),
    invite_par      UUID        NOT NULL,
    token           UUID        NOT NULL DEFAULT gen_random_uuid(),
    statut          VARCHAR(20) NOT NULL DEFAULT 'pending',
    expire_a        TIMESTAMPTZ NOT NULL,
    cree_a          TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_invitation PRIMARY KEY (id),
    CONSTRAINT uq_invitation_token UNIQUE (token),
    CONSTRAINT uq_invitation_email_asso UNIQUE (email, association_id),
    CONSTRAINT fk_invitation_asso       FOREIGN KEY (association_id) REFERENCES association(id) ON DELETE CASCADE,
    CONSTRAINT fk_invitation_invite_par FOREIGN KEY (invite_par)     REFERENCES compte(id)     ON DELETE CASCADE,
    CONSTRAINT ck_invitation_role       CHECK (role IN (
        'admin', 'responsable', 'coordinateur', 'benevole'
    )),
    CONSTRAINT ck_invitation_statut     CHECK (statut IN ('pending', 'accepted', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_invitation_token ON invitation(token);
CREATE INDEX IF NOT EXISTS idx_invitation_email ON invitation(email);
