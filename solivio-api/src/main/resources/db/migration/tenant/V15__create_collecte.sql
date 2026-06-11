CREATE TABLE mission_collecte (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre                     VARCHAR(200) NOT NULL,
    description               TEXT,
    lieu_collecte_place_id    VARCHAR(500),
    lieu_collecte_adresse     VARCHAR(500),
    lieu_collecte_latitude    NUMERIC(10,7),
    lieu_collecte_longitude   NUMERIC(10,7),
    lieu_depot_place_id       VARCHAR(500),
    lieu_depot_adresse        VARCHAR(500),
    lieu_depot_latitude       NUMERIC(10,7),
    lieu_depot_longitude      NUMERIC(10,7),
    date_heure                TIMESTAMPTZ NOT NULL,
    capacite_personnes        INTEGER NOT NULL DEFAULT 6,
    statut                    VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE',
    benevole_id               UUID REFERENCES personne(id),
    date_prise_en_charge      TIMESTAMPTZ,
    date_collecte_effectuee   TIMESTAMPTZ,
    date_depot_valide         TIMESTAMPTZ,
    annulee_par               UUID REFERENCES personne(id),
    raison_annulation         TEXT,
    cree_par_id               UUID NOT NULL REFERENCES personne(id),
    date_creation             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_statut_mission CHECK (
        statut IN ('DISPONIBLE','PRISE_EN_CHARGE','COLLECTE_EFFECTUEE','DEPOT_VALIDE','ANNULEE')
    )
);

CREATE INDEX idx_mission_collecte_statut   ON mission_collecte(statut);
CREATE INDEX idx_mission_collecte_benevole ON mission_collecte(benevole_id);
