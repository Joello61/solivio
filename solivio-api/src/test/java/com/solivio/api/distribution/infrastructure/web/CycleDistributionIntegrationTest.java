package com.solivio.api.distribution.infrastructure.web;

import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Retour a publiee apres un demarrage accidentel et reactivation d'une distribution
 * annulee par erreur, avec retablissement des inscriptions.
 */
@SolivioIntegrationTest
class CycleDistributionIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private UUID createur;
    private final LocalDate dans3Jours = LocalDate.now().plusDays(3);

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        createur = personne("coord@cycle.test");
    }

    @Test
    void annulerDemarrage_possibleTantQuePersonneNEstPointe() throws Exception {
        UUID distribution = distribution("EN_COURS", dans3Jours);
        UUID inscription = inscription(distribution, personne("a@cycle.test"), "CONFIRMEE", null);

        mockMvc.perform(post(url(distribution, "annuler-demarrage")).cookie(jeton("benevole")))
            .andExpect(status().isForbidden());
        mockMvc.perform(post(url(distribution, "annuler-demarrage")).cookie(jeton("coordinateur")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PUBLIEE"));

        jdbcTemplate.update("UPDATE distribution SET statut = 'EN_COURS' WHERE id = ?", distribution);
        jdbcTemplate.update("UPDATE inscription SET presence = 'PRESENT' WHERE id = ?", inscription);
        mockMvc.perform(post(url(distribution, "annuler-demarrage")).cookie(jeton("coordinateur")))
            .andExpect(status().isConflict());
    }

    @Test
    void reactiver_retablitLesInscriptionsSaufCellesQuiEnfreignentRg1() throws Exception {
        UUID distribution = distribution("PUBLIEE", dans3Jours);
        UUID confirmee = inscription(distribution, personne("conf@cycle.test"), "CONFIRMEE", null);
        UUID enAttente = inscription(distribution, personne("att@cycle.test"), "LISTE_ATTENTE", 1);
        UUID enAttente2 = inscription(distribution, personne("att2@cycle.test"), "LISTE_ATTENTE", 2);
        UUID ailleurs = personne("ailleurs@cycle.test");
        UUID inscriptionAilleurs = inscription(distribution, ailleurs, "CONFIRMEE", null);
        UUID desinscrit = inscription(distribution, personne("parti@cycle.test"), "ANNULEE", null);

        mockMvc.perform(post(url(distribution, "annuler")).cookie(jeton("coordinateur"))
                .contentType("application/json").content("{\"motif\": \"Erreur de saisie\"}"))
            .andExpect(status().isOk());
        await().atMost(15, TimeUnit.SECONDS).until(() -> statut(confirmee).equals("ANNULEE"));
        // Entre-temps, une personne s'inscrit a une autre distribution de la meme semaine.
        UUID autre = distribution("PUBLIEE", dans3Jours);
        inscription(autre, ailleurs, "CONFIRMEE", null);

        mockMvc.perform(post(url(distribution, "reactiver")).cookie(jeton("benevole")))
            .andExpect(status().isForbidden());
        mockMvc.perform(post(url(distribution, "reactiver")).cookie(jeton("coordinateur")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PUBLIEE"))
            .andExpect(jsonPath("$.motifAnnulation").doesNotExist());

        await().atMost(15, TimeUnit.SECONDS).until(() -> statut(confirmee).equals("CONFIRMEE"));
        // La place de la personne non retablie revient au premier de la liste d'attente (RG3) ;
        // le second reste en attente a son rang.
        await().atMost(15, TimeUnit.SECONDS).until(() -> statut(enAttente).equals("CONFIRMEE"));
        assertThat(statut(enAttente2)).isEqualTo("LISTE_ATTENTE");
        assertThat(jdbcTemplate.queryForObject("SELECT rang_liste_attente FROM inscription WHERE id = ?",
            Integer.class, enAttente2)).isEqualTo(2);
        assertThat(statut(inscriptionAilleurs)).isEqualTo("ANNULEE");
        // Une desinscription personnelle d'avant l'annulation n'est pas retablie.
        assertThat(statut(desinscrit)).isEqualTo("ANNULEE");
        await().atMost(15, TimeUnit.SECONDS).until(() -> jdbcTemplate.queryForObject(
            "SELECT count(*) FROM notification WHERE distribution_id = ? "
                + "AND type_evenement = 'REACTIVATION_DISTRIBUTION' AND statut = 'ENVOYE'",
            Integer.class, distribution) == 4);
    }

    @Test
    void reactiver_refuseUneDistributionPasseeOuNonAnnulee() throws Exception {
        UUID passee = distribution("ANNULEE", LocalDate.now().minusDays(2));
        UUID publiee = distribution("PUBLIEE", dans3Jours);

        mockMvc.perform(post(url(passee, "reactiver")).cookie(jeton("coordinateur")))
            .andExpect(status().isConflict());
        mockMvc.perform(post(url(publiee, "reactiver")).cookie(jeton("coordinateur")))
            .andExpect(status().isConflict());
    }

    private static String url(UUID distribution, String action) {
        return "/api/distributions/" + distribution + "/" + action;
    }

    private String statut(UUID inscription) {
        return jdbcTemplate.queryForObject("SELECT statut FROM inscription WHERE id = ?", String.class, inscription);
    }

    private Cookie jeton(String role) {
        return new Cookie("access_token", jwtService.genererAccessToken(
            UUID.randomUUID(), "acteur@cycle.test", "Nom", "Prenom", List.of(role), null, false));
    }

    private UUID personne(String email) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Nom', 'Prenom', ?)", id, email);
        return id;
    }

    private UUID distribution(String statut, LocalDate date) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, "
            + "capacite_benevoles, mode_creneau, base_repartition, cree_par_id) "
            + "VALUES (?, 'Distribution', ?, ?, 2, 5, 'CRENEAU_UNIQUE', 'INSCRITS', ?)",
            id, date, statut, createur);
        return id;
    }

    private UUID inscription(UUID distribution, UUID personne, String statut, Integer rang) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type, "
            + "statut, rang_liste_attente) VALUES (?, ?, ?, 'Nom', 'Prenom', 'BENEFICIAIRE', ?, ?)",
            id, distribution, personne, statut, rang);
        return id;
    }
}
