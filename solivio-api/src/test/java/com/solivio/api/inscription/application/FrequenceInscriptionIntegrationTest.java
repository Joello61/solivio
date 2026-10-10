package com.solivio.api.inscription.application;

import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * RG1 sur de vraies donnees : une distribution par semaine calendaire (limite par
 * defaut), inscriptions en attente comptees, distributions annulees ignorees.
 */
@SolivioIntegrationTest
class FrequenceInscriptionIntegrationTest {

    private static final String EMAIL = "marie@test.com";
    private static final Set<String> BENEFICIAIRE = Set.of("beneficiaire");

    @Autowired private InscriptionService inscriptionService;
    @Autowired private JdbcTemplate jdbcTemplate;

    private UUID marieId;
    private LocalDate lundi;

    @BeforeEach
    void setUp() {
        marieId = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Dupont', 'Marie', ?)",
            marieId, EMAIL);
        lundi = LocalDate.now().plusWeeks(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    @Test
    void refuseUneSecondeDistributionDansLaMemeSemaine() {
        UUID mardi = insererDistribution(lundi.plusDays(1), "PUBLIEE");
        UUID dimanche = insererDistribution(lundi.plusDays(6), "PUBLIEE");
        inscrire(mardi);

        assertThatThrownBy(() -> inscrire(dimanche))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("cette semaine");
    }

    @Test
    void autoriseLeLundiSuivantApresUnDimanche() {
        UUID dimanche = insererDistribution(lundi.plusDays(6), "PUBLIEE");
        UUID lundiSuivant = insererDistribution(lundi.plusDays(7), "PUBLIEE");
        inscrire(dimanche);

        inscrire(lundiSuivant);

        assertThat(statutInscription(lundiSuivant)).isEqualTo("CONFIRMEE");
    }

    @Test
    void compteUneInscriptionEnListeDAttente() {
        UUID mardi = insererDistribution(lundi.plusDays(1), "PUBLIEE");
        UUID jeudi = insererDistribution(lundi.plusDays(3), "PUBLIEE");
        insererInscription(mardi, "LISTE_ATTENTE");

        assertThatThrownBy(() -> inscrire(jeudi)).isInstanceOf(ConflictException.class);
    }

    @Test
    void ignoreUneDistributionAnnuleeDeLaSemaine() {
        UUID annulee = insererDistribution(lundi.plusDays(1), "ANNULEE");
        UUID jeudi = insererDistribution(lundi.plusDays(3), "PUBLIEE");
        insererInscription(annulee, "CONFIRMEE");

        inscrire(jeudi);

        assertThat(statutInscription(jeudi)).isEqualTo("CONFIRMEE");
    }

    private void inscrire(UUID distributionId) {
        inscriptionService.inscrire(distributionId, EMAIL, "BENEFICIAIRE", null, BENEFICIAIRE);
    }

    private UUID insererDistribution(LocalDate date, String statut) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, mode_creneau, "
                + "base_repartition, cree_par_id) VALUES (?, 'Distribution', ?, ?, 10, 'CRENEAU_UNIQUE', "
                + "'INSCRITS', ?)",
            id, date, statut, marieId);
        return id;
    }

    private void insererInscription(UUID distributionId, String statut) {
        jdbcTemplate.update(
            "INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type, statut, "
                + "rang_liste_attente) VALUES (?, ?, ?, 'Dupont', 'Marie', 'BENEFICIAIRE', ?, ?)",
            UUID.randomUUID(), distributionId, marieId, statut, "LISTE_ATTENTE".equals(statut) ? 1 : null);
    }

    private String statutInscription(UUID distributionId) {
        return jdbcTemplate.queryForObject(
            "SELECT statut FROM inscription WHERE distribution_id = ? AND personne_id = ?",
            String.class, distributionId, marieId);
    }
}
