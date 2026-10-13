package com.solivio.api.distribution.infrastructure.web;

import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Modification d'une distribution avant demarrage et suppression d'un brouillon :
 * places protegees, liste d'attente promue, inscrits prevenus.
 */
@SolivioIntegrationTest
class ModificationDistributionIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private UUID createur;
    private final LocalDate dans5Jours = LocalDate.now().plusDays(5);

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        createur = personne("coord@modif.test");
    }

    @Test
    void modifier_reserveAuxGestionnaires() throws Exception {
        UUID distribution = distribution("PUBLIEE", 10);
        UUID creneau = creneau(distribution, "17:00", "19:00", 10);

        modifier(distribution, corps("Titre change", dans5Jours, 10, creneau, "17:00", "19:00", 10), "benevole")
            .andExpect(status().isForbidden());
        modifier(distribution, corps("Titre change", dans5Jours, 10, creneau, "17:00", "19:00", 10), "coordinateur")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.titre").value("Titre change"));
    }

    @Test
    void modifier_refuseUneCapaciteSousLesInscritsConfirmes() throws Exception {
        UUID distribution = distribution("PUBLIEE", 10);
        UUID creneau = creneau(distribution, "17:00", "19:00", 10);
        inscription(distribution, creneau, personne("a@modif.test"), "CONFIRMEE", null);
        inscription(distribution, creneau, personne("b@modif.test"), "CONFIRMEE", null);

        modifier(distribution, corps("Distribution", dans5Jours, 1, creneau, "17:00", "19:00", 10), "coordinateur")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.message").value(org.hamcrest.Matchers.containsString("2 inscrits")));
    }

    @Test
    void modifier_refuseDeSupprimerUnCreneauQuiAdesInscriptions() throws Exception {
        UUID distribution = distribution("PUBLIEE", 10);
        UUID garde = creneau(distribution, "17:00", "18:00", 5);
        UUID inscrit = creneau(distribution, "18:00", "19:00", 5);
        inscription(distribution, inscrit, personne("a@modif.test"), "ANNULEE", null);

        modifier(distribution, corps("Distribution", dans5Jours, 10, garde, "17:00", "18:00", 5), "coordinateur")
            .andExpect(status().isConflict());
    }

    @Test
    void augmenterLaCapacite_promeutLaListeDAttente() throws Exception {
        UUID distribution = distribution("PUBLIEE", 1);
        UUID creneau = creneau(distribution, "17:00", "19:00", 10);
        inscription(distribution, creneau, personne("a@modif.test"), "CONFIRMEE", null);
        UUID enAttente = inscription(distribution, creneau, personne("b@modif.test"), "LISTE_ATTENTE", 1);

        modifier(distribution, corps("Distribution", dans5Jours, 2, creneau, "17:00", "19:00", 10), "coordinateur")
            .andExpect(status().isOk());

        await().atMost(15, TimeUnit.SECONDS).until(() -> "CONFIRMEE".equals(
            jdbcTemplate.queryForObject("SELECT statut FROM inscription WHERE id = ?", String.class, enAttente)));
    }

    @Test
    void changerLaDate_previentLesInscrits() throws Exception {
        UUID distribution = distribution("PUBLIEE", 10);
        UUID creneau = creneau(distribution, "17:00", "19:00", 10);
        UUID marie = personne("marie@modif.test");
        inscription(distribution, creneau, marie, "CONFIRMEE", null);

        modifier(distribution, corps("Distribution", dans5Jours.plusDays(1), 10, creneau, "17:00", "19:00", 10),
            "coordinateur").andExpect(status().isOk());

        await().atMost(15, TimeUnit.SECONDS).until(() -> jdbcTemplate.queryForObject(
            "SELECT count(*) FROM notification WHERE personne_id = ? AND type_evenement = 'MODIFICATION_DISTRIBUTION' "
                + "AND statut = 'ENVOYE'", Integer.class, marie) == 1);
    }

    @Test
    void modifier_refuseUneDistributionDemarree() throws Exception {
        UUID distribution = distribution("EN_COURS", 10);
        UUID creneau = creneau(distribution, "17:00", "19:00", 10);

        modifier(distribution, corps("Distribution", dans5Jours, 10, creneau, "17:00", "19:00", 10), "coordinateur")
            .andExpect(status().isConflict());
    }

    @Test
    void supprimer_seulementUnBrouillon() throws Exception {
        UUID brouillon = distribution("BROUILLON", 10);
        creneau(brouillon, "17:00", "19:00", 10);
        UUID publiee = distribution("PUBLIEE", 10);

        mockMvc.perform(delete("/api/distributions/" + publiee).cookie(jeton("coordinateur")))
            .andExpect(status().isConflict());
        mockMvc.perform(delete("/api/distributions/" + brouillon).cookie(jeton("benevole")))
            .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/distributions/" + brouillon).cookie(jeton("coordinateur")))
            .andExpect(status().isNoContent());
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM distribution WHERE id = ?", Integer.class,
            brouillon)).isZero();
    }

    @Test
    void changerBaseRepartition_enregistreLeChoixDuGestionnaire() throws Exception {
        UUID distribution = distribution("EN_COURS", 10);
        String presents = "{\"base\": \"PRESENTS\"}";

        mockMvc.perform(put("/api/distributions/" + distribution + "/base-repartition").cookie(jeton("benevole"))
            .contentType(MediaType.APPLICATION_JSON).content(presents)).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/distributions/" + distribution + "/base-repartition").cookie(jeton("coordinateur"))
            .contentType(MediaType.APPLICATION_JSON).content("{\"base\": \"TOUS\"}"))
            .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/distributions/" + distribution + "/base-repartition").cookie(jeton("coordinateur"))
            .contentType(MediaType.APPLICATION_JSON).content(presents))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.baseRepartition").value("PRESENTS"));
        assertThat(jdbcTemplate.queryForObject("SELECT base_repartition FROM distribution WHERE id = ?",
            String.class, distribution)).isEqualTo("PRESENTS");

        UUID annulee = distribution("ANNULEE", 10);
        mockMvc.perform(put("/api/distributions/" + annulee + "/base-repartition").cookie(jeton("coordinateur"))
            .contentType(MediaType.APPLICATION_JSON).content(presents)).andExpect(status().isConflict());
    }

    private ResultActions modifier(UUID distribution, String corps, String role) throws Exception {
        return mockMvc.perform(put("/api/distributions/" + distribution)
            .cookie(jeton(role))
            .contentType(MediaType.APPLICATION_JSON)
            .content(corps));
    }

    private static String corps(String titre, LocalDate date, int capacite, UUID creneau, String debut, String fin,
                                int capaciteCreneau) {
        return """
            {"titre": "%s", "date": "%s", "capaciteBeneficiaires": %d, "capaciteBenevoles": 5,
             "modeCreneau": "CRENEAUX_DECOUPES",
             "creneaux": [{"id": "%s", "heureDebut": "%s", "heureFin": "%s", "capacite": %d}]}
            """.formatted(titre, date, capacite, creneau, debut, fin, capaciteCreneau);
    }

    private Cookie jeton(String role) {
        return new Cookie("access_token", jwtService.genererAccessToken(
            UUID.randomUUID(), "acteur@modif.test", "Nom", "Prenom", List.of(role), null, false));
    }

    private UUID personne(String email) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Nom', 'Prenom', ?)", id, email);
        return id;
    }

    private UUID distribution(String statut, int capacite) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, "
            + "capacite_benevoles, mode_creneau, base_repartition, cree_par_id) "
            + "VALUES (?, 'Distribution', ?, ?, ?, 5, 'CRENEAUX_DECOUPES', 'INSCRITS', ?)",
            id, dans5Jours, statut, capacite, createur);
        return id;
    }

    private UUID creneau(UUID distribution, String debut, String fin, int capacite) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO creneau (id, distribution_id, heure_debut, heure_fin, capacite) "
            + "VALUES (?, ?, ?::time, ?::time, ?)", id, distribution, debut, fin, capacite);
        return id;
    }

    private UUID inscription(UUID distribution, UUID creneau, UUID personne, String statut, Integer rang) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, creneau_id, personne_id, nom, prenom, type, "
            + "statut, rang_liste_attente) VALUES (?, ?, ?, ?, 'Nom', 'Prenom', 'BENEFICIAIRE', ?, ?)",
            id, distribution, creneau, personne, statut, rang);
        return id;
    }
}
