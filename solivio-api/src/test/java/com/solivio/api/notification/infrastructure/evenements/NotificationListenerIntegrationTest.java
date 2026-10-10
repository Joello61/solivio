package com.solivio.api.notification.infrastructure.evenements;

import com.solivio.api.distribution.events.DistributionAnnulee;
import com.solivio.api.inscription.events.InscriptionConfirmee;
import com.solivio.api.inscription.events.InscriptionPromue;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * Chaine complete : publication dans une transaction, registre d'evenements,
 * ecouteur asynchrone apres validation, email recu par Mailpit.
 */
@SolivioIntegrationTest
class NotificationListenerIntegrationTest {

    @Value("${solivio.test.mailpit.api.base-url}")
    private String mailpitApiBaseUrl;

    @Autowired private ApplicationEventPublisher events;
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private JdbcTemplate jdbcTemplate;

    private final RestTemplate restTemplate = new RestTemplate();

    private UUID personneId;
    private UUID distributionId;

    @BeforeEach
    void setUp() {
        purgerMailpit();

        personneId = UUID.randomUUID();
        distributionId = UUID.randomUUID();

        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) VALUES (?, ?, ?, ?)",
            personneId, "Dupont", "Marie", "marie@example.com");
        jdbcTemplate.update(
            "INSERT INTO distribution "
                + "(id, titre, date, statut, capacite_beneficiaires, mode_creneau, base_repartition, cree_par_id) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            distributionId, "Distribution Test",
            LocalDate.now().plusDays(7), "PUBLIEE", 50,
            "CRENEAU_UNIQUE", "INSCRITS", personneId
        );
        jdbcTemplate.update(
            "INSERT INTO inscription "
                + "(id, distribution_id, personne_id, nom, prenom, type, statut, presence) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            UUID.randomUUID(), distributionId, personneId,
            "Dupont", "Marie", "BENEFICIAIRE", "CONFIRMEE", "NON_POINTE"
        );
    }

    @Test
    void inscriptionConfirmee_envoieEmailDeConfirmation() {
        publierDansUneTransaction(new InscriptionConfirmee(
            UUID.randomUUID(), distributionId, personneId, "BENEFICIAIRE", null, UUID.randomUUID()));

        await().atMost(15, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("marie@example.com") >= 1);

        List<Map<String, Object>> messages = messagesMailpitPour("marie@example.com");
        assertThat(messages).hasSize(1);
        assertThat(sujetDu(messages.get(0))).contains("inscription").containsIgnoringCase("confirmee")
            .contains("Distribution Test");
    }

    @Test
    void inscriptionPromue_envoieEmailDePromotion() {
        publierDansUneTransaction(new InscriptionPromue(
            UUID.randomUUID(), distributionId, personneId, "BENEVOLE", null, UUID.randomUUID()));

        await().atMost(15, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("marie@example.com") >= 1);

        assertThat(sujetDu(messagesMailpitPour("marie@example.com").get(0)))
            .contains("place").contains("Distribution Test");
    }

    // Livraison au moins une fois : un evenement rejoue (relance, redemarrage) ne
    // renvoie pas l'email grace a la cle d'idempotence.
    @Test
    void evenementRejoue_nEnvoieQuUnSeulEmail() {
        InscriptionConfirmee event = new InscriptionConfirmee(
            UUID.randomUUID(), distributionId, personneId, "BENEFICIAIRE", null, UUID.randomUUID());
        publierDansUneTransaction(event);
        await().atMost(15, TimeUnit.SECONDS).until(() -> publicationsArchiveesDeLaNotification() >= 1);

        publierDansUneTransaction(event);
        await().atMost(15, TimeUnit.SECONDS).until(() -> publicationsArchiveesDeLaNotification() >= 2);

        assertThat(compterEmailsPour("marie@example.com")).isEqualTo(1);
    }

    // Chaine RG6 : distribution annulee -> inscriptions annulees (module inscription)
    // -> email a chaque personne, confirmee ou en liste d'attente.
    @Test
    void distributionAnnulee_annuleLesInscriptionsEtPrevientConfirmesEtAttente() {
        UUID paulId = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Martin', 'Paul', ?)",
            paulId, "paul@example.com");
        jdbcTemplate.update(
            "INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type, statut, "
                + "rang_liste_attente) VALUES (?, ?, ?, 'Martin', 'Paul', 'BENEFICIAIRE', 'LISTE_ATTENTE', 1)",
            UUID.randomUUID(), distributionId, paulId);

        publierDansUneTransaction(new DistributionAnnulee(distributionId, LocalDate.now()));

        await().atMost(15, TimeUnit.SECONDS).until(() ->
            compterEmailsPour("marie@example.com") >= 1 && compterEmailsPour("paul@example.com") >= 1);

        assertThat(sujetDu(messagesMailpitPour("marie@example.com").get(0)))
            .contains("annulee").contains("Distribution Test");
        assertThat(jdbcTemplate.queryForList(
            "SELECT DISTINCT statut FROM inscription WHERE distribution_id = ?", String.class, distributionId))
            .containsExactly("ANNULEE");
    }

    // Avec Kafka, l'envoi partait avant la validation : un rollback notifiait quand meme.
    @Test
    void transactionAnnulee_nEnvoieAucunEmail() {
        transactionTemplate.executeWithoutResult(status -> {
            events.publishEvent(new InscriptionConfirmee(
                UUID.randomUUID(), distributionId, personneId, "BENEFICIAIRE", null, UUID.randomUUID()));
            status.setRollbackOnly();
        });

        await().during(3, TimeUnit.SECONDS).atMost(4, TimeUnit.SECONDS)
            .until(() -> compterEmailsPour("marie@example.com") == 0);
        assertThat(publicationsEnAttente()).isZero();
    }

    @Test
    void publicationTraitee_estArchiveeEtPlusEnAttente() {
        publierDansUneTransaction(new InscriptionConfirmee(
            UUID.randomUUID(), distributionId, personneId, "BENEFICIAIRE", null, UUID.randomUUID()));

        // MetriquesMetier archive sa publication des la validation : on attend celle de
        // l'ecouteur de notification, asynchrone, pour ne pas conclure trop tot.
        await().atMost(15, TimeUnit.SECONDS).until(() -> publicationsArchiveesDeLaNotification() >= 1);
        assertThat(publicationsEnAttente()).isZero();
    }

    private void publierDansUneTransaction(Object event) {
        transactionTemplate.executeWithoutResult(status -> events.publishEvent(event));
    }

    private int publicationsEnAttente() {
        return jdbcTemplate.queryForObject(
            "SELECT count(*) FROM event_publication WHERE completion_date IS NULL", Integer.class);
    }

    private int publicationsArchiveesDeLaNotification() {
        return jdbcTemplate.queryForObject(
            "SELECT count(*) FROM event_publication_archive WHERE listener_id LIKE ?", Integer.class,
            NotificationListener.class.getName() + "%");
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
