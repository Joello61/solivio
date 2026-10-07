package com.solivio.api.evenement.infrastructure.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.UUID;

@Service
public class EvenementEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(EvenementEventPublisher.class);
    private static final String TOPIC = "evenement";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public EvenementEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publierPublie(UUID evenementId, ZonedDateTime dateHeureDebut) {
        emettreEvenement("evenement.publie", evenementId, dateHeureDebut);
    }

    public void publierAnnule(UUID evenementId, ZonedDateTime dateHeureDebut) {
        emettreEvenement("evenement.annule", evenementId, dateHeureDebut);
    }

    private void emettreEvenement(
        String type, UUID evenementId, ZonedDateTime dateHeureDebut
    ) {
        EvenementEvent event = new EvenementEvent(
            type, evenementId, dateHeureDebut, Instant.now());
        kafkaTemplate.send(TOPIC, evenementId.toString(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Echec emission evenement {} pour evenement {}", type, evenementId, ex);
                } else {
                    log.debug("Evenement {} emis pour evenement {}", type, evenementId);
                }
            });
    }
}
