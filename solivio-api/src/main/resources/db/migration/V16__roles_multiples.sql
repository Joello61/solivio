-- ADR-012 : un membre peut cumuler les roles benevole, beneficiaire et coordinateur ;
-- un responsable n'a que ce role. Le statut et l'historique restent portes par membre.
CREATE TABLE membre_role (
    membre_id UUID        NOT NULL,
    role      VARCHAR(30) NOT NULL,

    CONSTRAINT pk_membre_role PRIMARY KEY (membre_id, role),
    CONSTRAINT fk_membre_role_membre FOREIGN KEY (membre_id) REFERENCES membre(id) ON DELETE CASCADE,
    CONSTRAINT ck_membre_role_role CHECK (role IN ('responsable', 'coordinateur', 'benevole', 'beneficiaire'))
);

CREATE INDEX idx_membre_role_role ON membre_role(role);

INSERT INTO membre_role (membre_id, role) SELECT id, role FROM membre;

-- Les coordinateurs pouvaient s'inscrire comme benevoles : ils gardent ce droit.
INSERT INTO membre_role (membre_id, role) SELECT id, 'benevole' FROM membre WHERE role = 'coordinateur';

-- membre.role n'est plus lu ; il reste le temps de la bascule (ADR-010), la version
-- precedente le lisant encore, et sera supprime par une migration ulterieure.
ALTER TABLE membre ALTER COLUMN role DROP NOT NULL;

-- Les invitations ne servent plus qu'a creer un responsable. Celles en attente pour
-- un autre role expirent ; l'historique garde son role d'origine.
UPDATE invitation SET statut = 'expired' WHERE statut = 'pending' AND role <> 'responsable';
