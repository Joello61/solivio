package com.solivio.api.inscription.application;

import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Inscriptions simultanees sur une meme distribution : la capacite n'est jamais
 * depassee et chaque rang de liste d'attente est unique (verrou par distribution).
 */
@SolivioIntegrationTest
class InscriptionConcurrenceIntegrationTest {

    private static final int CAPACITE = 2;
    private static final int CANDIDATS = 5;

    @Autowired private InscriptionService inscriptionService;
    @Autowired private JdbcTemplate jdbcTemplate;

    @Test
    void inscriptionsSimultanees_respectentLaCapaciteEtLesRangs() throws Exception {
        UUID createurId = insererPersonne("coord@test.com");
        UUID distributionId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, mode_creneau, "
                + "base_repartition, cree_par_id) VALUES (?, 'Distribution', ?, 'PUBLIEE', ?, "
                + "'CRENEAU_UNIQUE', 'INSCRITS', ?)",
            distributionId, LocalDate.now().plusDays(2), CAPACITE, createurId);
        List<String> emails = new ArrayList<>();
        for (int i = 0; i < CANDIDATS; i++) {
            String email = "benef" + i + "@test.com";
            insererPersonne(email);
            emails.add(email);
        }

        ExecutorService executeur = Executors.newFixedThreadPool(CANDIDATS);
        CountDownLatch depart = new CountDownLatch(1);
        List<Future<?>> resultats = new ArrayList<>();
        for (String email : emails) {
            resultats.add(executeur.submit(() -> {
                depart.await();
                return inscriptionService.inscrire(
                    distributionId, email, "BENEFICIAIRE", null, Set.of("beneficiaire"));
            }));
        }
        depart.countDown();
        for (Future<?> resultat : resultats) {
            resultat.get(30, TimeUnit.SECONDS);
        }
        executeur.shutdown();

        Integer confirmees = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM inscription WHERE distribution_id = ? AND statut = 'CONFIRMEE'",
            Integer.class, distributionId);
        List<Integer> rangs = jdbcTemplate.queryForList(
            "SELECT rang_liste_attente FROM inscription WHERE distribution_id = ? AND statut = 'LISTE_ATTENTE' "
                + "ORDER BY rang_liste_attente",
            Integer.class, distributionId);
        assertThat(confirmees).isEqualTo(CAPACITE);
        assertThat(rangs).containsExactly(1, 2, 3);
    }

    private UUID insererPersonne(String email) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Test', 'Test', ?)", id, email);
        return id;
    }
}
