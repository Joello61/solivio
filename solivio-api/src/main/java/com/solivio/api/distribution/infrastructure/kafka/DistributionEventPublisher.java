package com.solivio.api.distribution.infrastructure.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Service
public class DistributionEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(DistributionEventPublisher.class);
    private static final String TOPIC = "distributions";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public DistributionEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publierPubliee(UUID distributionId, LocalDate date) {
        emettreEvenement("distribution.publiee", distributionId, date);
    }

    public void publierAnnulee(UUID distributionId, LocalDate date) {
        emettreEvenement("distribution.annulee", distributionId, date);
    }

    public void publierTerminee(UUID distributionId, LocalDate date) {
        emettreEvenement("distribution.terminee", distributionId, date);
    }

    private void emettreEvenement(String type, UUID distributionId, LocalDate date) {
        DistributionEvent event = new DistributionEvent(type, distributionId, date, Instant.now());
        kafkaTemplate.send(TOPIC, distributionId.toString(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Echec emission evenement {} pour distribution {}", type, distributionId, ex);
                } else {
                    log.debug("Evenement {} emis pour distribution {}", type, distributionId);
                }
            });
    }
}
