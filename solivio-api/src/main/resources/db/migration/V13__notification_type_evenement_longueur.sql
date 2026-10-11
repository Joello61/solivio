-- Les types lies au reconditionnement depassent 35 caracteres
-- (CONFIRMATION_INSCRIPTION_RECONDITIONNEMENT : 42) : leurs traces echouaient a l'insertion.
ALTER TABLE notification ALTER COLUMN type_evenement TYPE VARCHAR(50);
