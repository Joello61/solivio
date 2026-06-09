-- V9 shared: alignement du type de frequence_max_par_semaine
-- V7 avait cree la colonne en SMALLINT ; l'entite JPA utilise Integer (INTEGER).
ALTER TABLE association
    ALTER COLUMN frequence_max_par_semaine TYPE INTEGER;
