package com.solivio.api.identity.application;

import com.solivio.api.identity.infrastructure.web.dto.UpdateRolesMembreRequest;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * L'association garde toujours un responsable actif, et personne n'agit sur son
 * propre compte depuis la gestion des membres ou des comptes.
 */
@SolivioIntegrationTest
class GardeMembresIntegrationTest {

    private static final UpdateRolesMembreRequest COORDINATEUR =
        new UpdateRolesMembreRequest(List.of("coordinateur"), null);

    @Autowired private MembreService membreService;
    @Autowired private AdminCompteService adminCompteService;
    @Autowired private JdbcTemplate jdbcTemplate;

    private final UUID superAdmin = UUID.randomUUID();

    @Test
    void refuseDeModifierSonPropreRoleOuStatut() {
        UUID resp = insererMembre("responsable");
        insererMembre("responsable");

        assertThatThrownBy(() -> membreService.mettreAJourRoles(resp, COORDINATEUR, resp))
            .isInstanceOf(ConflictException.class).hasMessageContaining("propre compte");
        assertThatThrownBy(() -> membreService.changerStatut(resp, "suspendu", resp))
            .isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> adminCompteService.supprimer(resp, resp))
            .isInstanceOf(ConflictException.class);
    }

    @Test
    void refuseDeRetrograderOuSuspendreLeDernierResponsable() {
        UUID resp = insererMembre("responsable");

        assertThatThrownBy(() -> membreService.mettreAJourRoles(resp, COORDINATEUR, superAdmin))
            .isInstanceOf(ConflictException.class).hasMessageContaining("au moins un responsable");
        assertThatThrownBy(() -> membreService.suspendre(resp, superAdmin))
            .isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> adminCompteService.mettreAJourStatut(resp, false, superAdmin))
            .isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> adminCompteService.supprimer(resp, superAdmin))
            .isInstanceOf(ConflictException.class);
        assertThat(roleDe(resp)).isEqualTo("responsable");
    }

    @Test
    void autoriseLaRetrogradationQuandUnAutreResponsableReste() {
        UUID resp1 = insererMembre("responsable");
        UUID resp2 = insererMembre("responsable");

        membreService.mettreAJourRoles(resp2, COORDINATEUR, resp1);

        assertThat(roleDe(resp2)).isEqualTo("coordinateur");
    }

    @Test
    void neBloquePasLesAutresRoles() {
        insererMembre("responsable");
        UUID coord = insererMembre("coordinateur");

        membreService.suspendre(coord, superAdmin);

        assertThat(jdbcTemplate.queryForObject("SELECT statut FROM membre WHERE compte_id = ?", String.class, coord))
            .isEqualTo("suspendu");
    }

    // Deux responsables se retrogradent l'un l'autre au meme instant : sans verrou,
    // les deux voyaient un autre responsable et l'association n'en gardait aucun.
    @Test
    void retrogradationsCroiseesSimultanees_laissentUnResponsable() throws Exception {
        UUID resp1 = insererMembre("responsable");
        UUID resp2 = insererMembre("responsable");

        ExecutorService executeur = Executors.newFixedThreadPool(2);
        CountDownLatch depart = new CountDownLatch(1);
        List<Future<?>> resultats = new ArrayList<>();
        resultats.add(executeur.submit(() -> {
            depart.await();
            return membreService.mettreAJourRoles(resp2, COORDINATEUR, resp1);
        }));
        resultats.add(executeur.submit(() -> {
            depart.await();
            return membreService.mettreAJourRoles(resp1, COORDINATEUR, resp2);
        }));
        depart.countDown();
        int refus = 0;
        for (Future<?> resultat : resultats) {
            try {
                resultat.get(30, TimeUnit.SECONDS);
            } catch (ExecutionException e) {
                assertThat(e.getCause()).isInstanceOf(ConflictException.class);
                refus++;
            }
        }
        executeur.shutdown();

        assertThat(refus).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
            "SELECT count(*) FROM membre m JOIN membre_role r ON r.membre_id = m.id"
                + " WHERE r.role = 'responsable' AND m.statut = 'actif'", Integer.class))
            .isEqualTo(1);
    }

    private UUID insererMembre(String role) {
        UUID compteId = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO compte (id, email, password_hash, nom, prenom, email_verifie) "
            + "VALUES (?, ?, 'hash', 'Nom', 'Prenom', true)", compteId, compteId + "@garde.test");
        UUID membreId = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO membre (id, compte_id) VALUES (?, ?)", membreId, compteId);
        jdbcTemplate.update("INSERT INTO membre_role (membre_id, role) VALUES (?, ?)", membreId, role);
        return compteId;
    }

    private String roleDe(UUID compteId) {
        return jdbcTemplate.queryForObject("SELECT string_agg(r.role, ',' ORDER BY r.role) FROM membre m"
            + " JOIN membre_role r ON r.membre_id = m.id WHERE m.compte_id = ?", String.class, compteId);
    }
}
