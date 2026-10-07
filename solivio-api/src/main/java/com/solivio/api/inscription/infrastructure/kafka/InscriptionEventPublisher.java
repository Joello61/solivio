package com.solivio.api.inscription.infrastructure.kafka;

import com.solivio.api.inscription.domain.Inscription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class InscriptionEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(InscriptionEventPublisher.class);
    private static final String TOPIC = "inscriptions";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public InscriptionEventPublisher(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publierConfirmee(Inscription inscription) {
        emettre("inscription.confirmee", inscription);
    }

    public void publierAnnulee(Inscription inscription) {
        emettre("inscription.annulee", inscription);
    }

    public void publierPromue(Inscription inscription) {
        emettre("inscription.promue", inscription);
    }

    public void publierDesistementTardifBenevole(Inscription inscription) {
        emettre("inscription.desistement_tardif_benevole", inscription);
    }

    private void emettre(String type, Inscription inscription) {
        InscriptionEvent event = new InscriptionEvent(
            type,
            inscription.getId(),
            inscription.getDistributionId(),
            inscription.getPersonneId(),
            inscription.getType().name(),
            inscription.getCreneauId(),
            Instant.now()
        );
        kafkaTemplate.send(TOPIC, inscription.getId().toString(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Echec emission evenement {} pour inscription {}",
                        type, inscription.getId(), ex);
                } else {
                    log.debug("Evenement {} emis pour inscription {}", type, inscription.getId());
                }
            });
    }
}
