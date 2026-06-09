-- V8 tenant: module statistiques
-- Stats agregees par distribution, calculees a la cloture (statut TERMINEE).
-- distribution_date est une copie denormalisee de distribution.date,
-- stockee ici pour eviter une jointure sur chaque requete de periode.

CREATE TABLE statistique_distribution (
    distribution_id          UUID           NOT NULL,
    distribution_date        DATE           NOT NULL,
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
