-- V8 shared: photo de profil sur le compte global
ALTER TABLE compte
    ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);
