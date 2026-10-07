package com.solivio.api.notification.infrastructure.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class RappelEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(RappelEventPublisher.class);
    static final String TOPIC = "rappels";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public RappelEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publierRappelVeille(UUID distributionId) {
        RappelEvent event = new RappelEvent("rappel.veille", distributionId, Instant.now());
        kafkaTemplate.send(TOPIC, distributionId.toString(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Echec emission rappel.veille pour distribution {}", distributionId, ex);
                } else {
                    log.debug("Evenement rappel.veille emis pour distribution {}", distributionId);
                }
            });
    }
}
