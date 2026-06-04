-- init-db-dev.sql
-- Executed once by PostgreSQL on first container start.
-- Creates the keycloak database and user alongside the main solivio database.
-- Place this file at the project root alongside docker-compose-dev.yml.

CREATE USER keycloak WITH PASSWORD 'keycloak_dev';
CREATE DATABASE keycloak OWNER keycloak;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;