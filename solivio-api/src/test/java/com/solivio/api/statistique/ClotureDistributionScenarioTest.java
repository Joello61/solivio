package com.solivio.api.statistique;

import com.solivio.api.distribution.application.DistributionService;
import com.solivio.api.distribution.events.DistributionTerminee;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.modulith.test.EnableScenarios;
import org.springframework.modulith.test.Scenario;

import java.time.LocalDate;
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
}
