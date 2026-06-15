package com.solivio.api.reconditionnement.infrastructure.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class ReconditionnementEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(ReconditionnementEventPublisher.class);
    private static final String TOPIC = "reconditionnement";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public ReconditionnementEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publierPubliee(UUID sessionId, String tenantSlug, ZonedDateTime dateHeureDebut) {
        emettreEvenement("reconditionnement.publie", sessionId, tenantSlug, dateHeureDebut);
    }

    public void publierAnnulee(UUID sessionId, String tenantSlug, ZonedDateTime dateHeureDebut) {
        emettreEvenement("reconditionnement.annule", sessionId, tenantSlug, dateHeureDebut);
    }

    private void emettreEvenement(
        String type, UUID sessionId, String tenantSlug, ZonedDateTime dateHeureDebut
    ) {
        ReconditionnementEvent event = new ReconditionnementEvent(
            type, sessionId, tenantSlug, dateHeureDebut, Instant.now());
        kafkaTemplate.send(TOPIC, sessionId.toString(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Echec emission evenement {} pour session {}", type, sessionId, ex);
                } else {
                    log.debug("Evenement {} emis pour session {}", type, sessionId);
                }
            });
    }
}
