package com.solivio.api.notification.infrastructure.scheduler;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.notification.infrastructure.kafka.RappelEventPublisher;
import com.solivio.api.support.SolivioIntegrationTest;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.KafkaMessageListenerContainer;
import org.springframework.kafka.listener.MessageListener;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.utils.ContainerTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SolivioIntegrationTest
class RappelVeilleJobTest {

    @Value("${solivio.test.mailpit.api.base-url}")
    private String mailpitApiBaseUrl;

    @Autowired
    private RappelVeilleJob rappelVeilleJob;

    @Autowired
    private AssociationRepository associationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RestTemplate restTemplate = new RestTemplate();

    private Association association;
    private UUID distributionId;
    private UUID personneId;

    @BeforeEach
    void setUp() {
        restTemplate.delete(mailpitApiBaseUrl + "/api/v1/messages");

        personneId = UUID.randomUUID();
        distributionId = UUID.randomUUID();

        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) VALUES (?, ?, ?, ?)",
            personneId, "Martin", "Paul", "paul@example.com");
        // Distribution pour demain, statut PUBLIEE
        jdbcTemplate.update(
            "INSERT INTO distribution "
                + "(id, titre, date, statut, capacite_beneficiaires, mode_creneau, base_repartition, cree_par_id) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            distributionId, "Distribution Rappel",
            LocalDate.now().plusDays(1), "PUBLIEE", 30,
            "CRENEAU_UNIQUE", "INSCRITS", personneId
        );
        jdbcTemplate.update(
            "INSERT INTO inscription "
                + "(id, distribution_id, personne_id, nom, prenom, type, statut, presence) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            UUID.randomUUID(), distributionId, personneId,
            "Martin", "Paul", "BENEFICIAIRE", "CONFIRMEE", "NON_POINTE"
        );
    }

    @AfterEach
    void tearDown() {
    }

    @Test
    void emettreRappelsVeille_envoieRappelAuxInscritsDeDistributionsDemain() {
        rappelVeilleJob.emettreRappelsVeille();

        // Le job emet des evenements Kafka consommes par RappelNotificationConsumer
        await().atMost(20, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("paul@example.com") >= 1);

        List<Map<String, Object>> messages = messagesMailpitPour("paul@example.com");
        assertThat(messages).hasSize(1);
        assertThat(sujetDu(messages.get(0)))
            .contains("demain").contains("Distribution Rappel");
    }

    @Test
    void emettreRappelsPourAssociation_distributionPassee_nEmetPasDeRappel() {
        // Modifier la date de la distribution pour qu'elle soit aujourd'hui (pas demain)
        jdbcTemplate.update(
            "UPDATE distribution SET date = ? WHERE id = ?",
            LocalDate.now(), distributionId
        );

        rappelVeilleJob.emettreRappels(LocalDate.now().plusDays(1));

        await().during(3, TimeUnit.SECONDS).atMost(4, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("paul@example.com") == 0);
    }

    // --- Helpers Mailpit ---

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> tousLesMessages() {
        Map<String, Object> response = restTemplate.getForObject(
            mailpitApiBaseUrl + "/api/v1/messages", Map.class);
        if (response == null || !response.containsKey("messages")) {
            return List.of();
        }
        return (List<Map<String, Object>>) response.get("messages");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> messagesMailpitPour(String email) {
        return tousLesMessages().stream()
            .filter(msg -> {
                List<Map<String, Object>> to = (List<Map<String, Object>>) msg.get("To");
                return to != null && to.stream()
                    .anyMatch(dest -> email.equals(dest.get("Address")));
            })
            .toList();
    }

    private int compterEmailsPour(String email) {
        return messagesMailpitPour(email).size();
    }

    private String sujetDu(Map<String, Object> message) {
        return String.valueOf(message.get("Subject"));
    }
}
