package com.solivio.api.notification.infrastructure.kafka;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantFlywayMigrator;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.distribution.infrastructure.kafka.DistributionEvent;
import com.solivio.api.inscription.infrastructure.kafka.InscriptionEvent;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SolivioIntegrationTest
class NotificationConsumerIntegrationTest {

    @Value("${solivio.test.mailpit.api.base-url}")
    private String mailpitApiBaseUrl;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AssociationRepository associationRepository;

    @Autowired
    private TenantFlywayMigrator flywayMigrator;

    private final RestTemplate restTemplate = new RestTemplate();

    private Association association;
    private String tenantSlug;
    private String schema;
    private UUID personneId;
    private UUID distributionId;

    @BeforeEach
    void setUp() {
        purgerMailpit();

        tenantSlug = "notif-it";
        association = new Association(tenantSlug, "Asso Notification Test");
        association.setCode("NOTIFIT");
        associationRepository.save(association);

        schema = TenantProvisioningService.schemaName(tenantSlug);
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
        flywayMigrator.migrate(schema);

        personneId = UUID.randomUUID();
        distributionId = UUID.randomUUID();

        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".personne (id, nom, prenom, email, compte_email) VALUES (?, ?, ?, ?, ?)",
            personneId, "Dupont", "Marie", "marie@example.com", "marie@example.com"
        );
        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".distribution "
                + "(id, titre, date, statut, capacite_beneficiaires, mode_creneau, base_repartition, cree_par_id) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            distributionId, "Distribution Test",
            LocalDate.now().plusDays(7), "PUBLIEE", 50,
            "CRENEAU_UNIQUE", "INSCRITS", personneId
        );
        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".inscription "
                + "(id, distribution_id, personne_id, nom, prenom, type, statut, presence) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            UUID.randomUUID(), distributionId, personneId,
            "Dupont", "Marie", "BENEFICIAIRE", "CONFIRMEE", "NON_POINTE"
        );
    }

    @AfterEach
    void tearDown() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        associationRepository.delete(association);
    }

    @Test
    void inscriptionConfirmee_envoieEmailDeConfirmation() {
        InscriptionEvent event = new InscriptionEvent(
            "inscription.confirmee", UUID.randomUUID(),
            distributionId, personneId, "BENEFICIAIRE", null, tenantSlug, Instant.now()
        );
        kafkaTemplate.send("inscriptions", event.inscriptionId().toString(), event);

        await().atMost(15, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("marie@example.com") >= 1);

        List<Map<String, Object>> messages = messagesMailpitPour("marie@example.com");
        assertThat(messages).hasSize(1);
        String sujet = sujetDu(messages.get(0));
        assertThat(sujet).contains("inscription").containsIgnoringCase("confirmee")
            .contains("Distribution Test");
    }

    @Test
    void inscriptionPromue_envoieEmailDePromotion() {
        InscriptionEvent event = new InscriptionEvent(
            "inscription.promue", UUID.randomUUID(),
            distributionId, personneId, "BENEVOLE", null, tenantSlug, Instant.now()
        );
        kafkaTemplate.send("inscriptions", event.inscriptionId().toString(), event);

        await().atMost(15, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("marie@example.com") >= 1);

        List<Map<String, Object>> messages = messagesMailpitPour("marie@example.com");
        assertThat(messages).hasSize(1);
        assertThat(sujetDu(messages.get(0))).contains("place").contains("Distribution Test");
    }

    @Test
    void inscriptionAnnulee_nenvoiePasDemail() {
        InscriptionEvent event = new InscriptionEvent(
            "inscription.annulee", UUID.randomUUID(),
            distributionId, personneId, "BENEFICIAIRE", null, tenantSlug, Instant.now()
        );
        kafkaTemplate.send("inscriptions", event.inscriptionId().toString(), event);

        // Attente courte pour laisser le temps au consumer de traiter si bug
        await().during(3, TimeUnit.SECONDS).atMost(4, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("marie@example.com") == 0);
    }

    @Test
    void distributionAnnulee_envoieEmailATousLesInscritsConfirmes() {
        DistributionEvent event = new DistributionEvent(
            "distribution.annulee", distributionId, tenantSlug, LocalDate.now(), Instant.now()
        );
        kafkaTemplate.send("distributions", distributionId.toString(), event);

        await().atMost(15, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("marie@example.com") >= 1);

        List<Map<String, Object>> messages = messagesMailpitPour("marie@example.com");
        assertThat(messages).hasSize(1);
        assertThat(sujetDu(messages.get(0))).contains("annulee").contains("Distribution Test");
    }

    @Test
    void distributionPubliee_nenvoiePasDemail() {
        DistributionEvent event = new DistributionEvent(
            "distribution.publiee", distributionId, tenantSlug, LocalDate.now(), Instant.now()
        );
        kafkaTemplate.send("distributions", distributionId.toString(), event);

        await().during(3, TimeUnit.SECONDS).atMost(4, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("marie@example.com") == 0);
    }

    // --- Helpers Mailpit ---

    private void purgerMailpit() {
        restTemplate.delete(mailpitApiBaseUrl + "/api/v1/messages");
    }

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
