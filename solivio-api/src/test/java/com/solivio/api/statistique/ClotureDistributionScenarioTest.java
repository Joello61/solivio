package com.solivio.api.statistique;

import com.solivio.api.distribution.application.DistributionService;
import com.solivio.api.distribution.events.DistributionTerminee;
import com.solivio.api.inscription.events.AbsencesEnregistrees;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.modulith.test.EnableScenarios;
import org.springframework.modulith.test.Scenario;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Interaction entre modules par evenement : la cloture d'une distribution
 * (module distribution) declenche le calcul des statistiques (module statistique).
 */
@SolivioIntegrationTest
@EnableScenarios
class ClotureDistributionScenarioTest {

    @Autowired private DistributionService distributionService;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    void terminerUneDistribution_publieLEvenementEtEnregistreSesStatistiques(Scenario scenario) {
        UUID createurId = UUID.randomUUID();
        UUID distributionId = UUID.randomUUID();
        LocalDate date = LocalDate.now();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Coord', 'Test', 'coord@test.com')",
            createurId);
        jdbcTemplate.update(
            "INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, mode_creneau, "
                + "base_repartition, cree_par_id) VALUES (?, 'Distribution', ?, 'EN_COURS', 10, "
                + "'CRENEAU_UNIQUE', 'INSCRITS', ?)",
            distributionId, date, createurId);

        scenario.stimulate(() -> distributionService.terminer(distributionId))
            .andWaitForEventOfType(DistributionTerminee.class)
            .matching(event -> event.distributionId().equals(distributionId))
            .toArriveAndVerify(event -> assertThat(event.date()).isEqualTo(date));

        scenario.stimulate(() -> { })
            .andWaitForStateChange(() -> jdbcTemplate.queryForObject(
                "SELECT count(*) FROM statistique_distribution WHERE distribution_id = ?", Integer.class,
                distributionId), count -> count != null && count == 1)
            .andVerify(count -> assertThat(count).isEqualTo(1));
    }

    @Test
    void terminer_enregistreLesAbsencesPuisCalculeLesStatistiques(Scenario scenario) {
        UUID createurId = UUID.randomUUID();
        UUID distributionId = UUID.randomUUID();
        LocalDate date = LocalDate.now();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Coord', 'Test', 'c2@test.com')",
            createurId);
        jdbcTemplate.update(
            "INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, mode_creneau, "
                + "base_repartition, cree_par_id) VALUES (?, 'Distribution', ?, 'EN_COURS', 10, "
                + "'CRENEAU_UNIQUE', 'INSCRITS', ?)",
            distributionId, date, createurId);
        inscription(distributionId, "present@test.com", "BENEFICIAIRE", "PRESENT");
        inscription(distributionId, "absent@test.com", "BENEFICIAIRE", "ABSENT");
        UUID nonPointe = inscription(distributionId, "oubli@test.com", "BENEFICIAIRE", "NON_POINTE");
        UUID benevole = inscription(distributionId, "benevole@test.com", "BENEVOLE", "NON_POINTE");

        scenario.stimulate(() -> distributionService.terminer(distributionId))
            .andWaitForEventOfType(AbsencesEnregistrees.class)
            .matching(event -> event.distributionId().equals(distributionId))
            .toArrive();

        scenario.stimulate(() -> { })
            .andWaitForStateChange(() -> jdbcTemplate.queryForList(
                "SELECT nb_absents_beneficiaires, nb_non_pointes FROM statistique_distribution "
                    + "WHERE distribution_id = ?", distributionId), lignes -> !lignes.isEmpty())
            .andVerify(lignes -> {
                Map<String, Object> stats = lignes.get(0);
                // Le non pointe est une absence deduite : compte a part de l'absence pointee.
                assertThat(((Number) stats.get("nb_absents_beneficiaires")).intValue()).isEqualTo(1);
                assertThat(((Number) stats.get("nb_non_pointes")).intValue()).isEqualTo(1);
            });
        assertThat(jdbcTemplate.queryForMap("SELECT presence, absence_deduite FROM inscription WHERE id = ?",
            nonPointe)).containsEntry("presence", "ABSENT").containsEntry("absence_deduite", true);
        // RG4 ne concerne que les beneficiaires.
        assertThat(jdbcTemplate.queryForObject("SELECT presence FROM inscription WHERE id = ?", String.class,
            benevole)).isEqualTo("NON_POINTE");
    }

    private UUID inscription(UUID distributionId, String email, String type, String presence) {
        UUID personne = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Nom', 'Prenom', ?)",
            personne, email);
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type, statut, "
            + "presence) VALUES (?, ?, ?, 'Nom', 'Prenom', ?, 'CONFIRMEE', ?)", id, distributionId, personne, type,
            presence);
        return id;
    }
}
