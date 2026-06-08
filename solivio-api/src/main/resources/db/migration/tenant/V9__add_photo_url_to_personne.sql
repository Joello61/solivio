-- V9 tenant: photo de profil sur la personne du tenant
ALTER TABLE personne
    ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
