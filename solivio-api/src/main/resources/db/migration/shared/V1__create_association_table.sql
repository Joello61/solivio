-- V1: registre global des associations (schema public)
-- Cette table est la seule a vivre dans le schema public.
-- Chaque association possede son propre schema tenant isole.

CREATE TABLE IF NOT EXISTS association (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    slug                VARCHAR(63) NOT NULL,
    nom                 VARCHAR(255) NOT NULL,
    sous_domaine        VARCHAR(63),
    statut              VARCHAR(20)  NOT NULL DEFAULT 'active',
    configuration       JSONB        NOT NULL DEFAULT '{}',
    date_creation       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT pk_association PRIMARY KEY (id),
    CONSTRAINT uq_association_slug UNIQUE (slug),
    CONSTRAINT uq_association_sous_domaine UNIQUE (sous_domaine),
    CONSTRAINT ck_association_statut CHECK (statut IN ('active', 'suspendue', 'supprimee'))
);
