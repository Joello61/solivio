package com.solivio.api.notification.application;

import com.solivio.api.notification.domain.Notification;
import com.solivio.api.notification.domain.StatutNotification;
import com.solivio.api.notification.infrastructure.persistence.NotificationRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Idempotence et trace des envois. Separe de NotificationService pour que les
 * propagations transactionnelles passent par le proxy Spring.
 */
@Component
public class NotificationTraceur {

    private final NotificationRepository notificationRepository;
    private final JdbcTemplate jdbcTemplate;

    public NotificationTraceur(NotificationRepository notificationRepository, JdbcTemplate jdbcTemplate) {
        this.notificationRepository = notificationRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Verrouille le couple (cle, personne) jusqu'a la fin de la transaction de l'ecouteur,
     * puis dit si l'email est deja parti. Deux traitements simultanes du meme evenement
     * (relance, ou deux instances pendant un deploiement, ADR-010) s'attendent ainsi au
     * lieu d'envoyer chacun l'email.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean dejaEnvoyee(String cle, UUID personneId) {
        if (cle == null) {
            return false;
        }
        jdbcTemplate.query("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))", rs -> null,
            "notification:" + cle + ":" + personneId);
        return notificationRepository.existsByCleIdempotenceAndPersonneIdAndStatut(
            cle, personneId, StatutNotification.ENVOYE);
    }

    /** Transaction propre : la trace survit a l'exception qui fait relancer l'ecouteur. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void tracer(Notification notification) {
        notificationRepository.save(notification);
    }
}
