-- ADR-012 : les roles vivent dans membre_role depuis V16. membre.role, gardee le temps de
-- la bascule (ADR-010), n'est plus lue par aucune version deployee : on la supprime, avec
-- son index et sa contrainte.
DROP INDEX IF EXISTS idx_membre_role;
ALTER TABLE membre DROP CONSTRAINT IF EXISTS ck_membre_role;
ALTER TABLE membre DROP COLUMN role;
