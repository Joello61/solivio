-- V8 : registre de publication des evenements internes (Spring Modulith, ADR-003).
-- Schema "v2" fourni par spring-modulith-events-jdbc 2.1 pour PostgreSQL ;
-- Flyway le gere seul (spring.modulith.events.jdbc.schema-initialization desactive).
CREATE TABLE event_publication (
    id                     UUID                     NOT NULL,
    listener_id            TEXT                     NOT NULL,
    event_type             TEXT                     NOT NULL,
    serialized_event       TEXT                     NOT NULL,
    publication_date       TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_date        TIMESTAMP WITH TIME ZONE,
    status                 TEXT,
    completion_attempts    INT,
    last_resubmission_date TIMESTAMP WITH TIME ZONE,

    CONSTRAINT pk_event_publication PRIMARY KEY (id)
);

CREATE INDEX event_publication_serialized_event_hash_idx ON event_publication USING hash(serialized_event);
CREATE INDEX event_publication_by_completion_date_idx ON event_publication (completion_date);

-- Evenements traites, conserves pour la tracabilite (completion-mode archive).
CREATE TABLE event_publication_archive (
    id                     UUID                     NOT NULL,
    listener_id            TEXT                     NOT NULL,
    event_type             TEXT                     NOT NULL,
    serialized_event       TEXT                     NOT NULL,
    publication_date       TIMESTAMP WITH TIME ZONE NOT NULL,
    completion_date        TIMESTAMP WITH TIME ZONE,
    status                 TEXT,
    completion_attempts    INT,
    last_resubmission_date TIMESTAMP WITH TIME ZONE,

    CONSTRAINT pk_event_publication_archive PRIMARY KEY (id)
);

CREATE INDEX event_publication_archive_serialized_event_hash_idx ON event_publication_archive USING hash(serialized_event);
CREATE INDEX event_publication_archive_by_completion_date_idx ON event_publication_archive (completion_date);
