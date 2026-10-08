package com.solivio.api.statistique.infrastructure.web;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class StatistiqueControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private UUID responsableId;
    private String tokenResponsable;
    private String tokenBeneficiaire;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        responsableId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) "
                + "VALUES (?, 'Resp', 'Test', 'resp@test.com')",
            responsableId
        );

        tokenResponsable = jwtService.genererAccessToken(
            responsableId, "resp@test.com", "Resp", "Test", List.of("responsable"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@test.com", "Benef", "Test", List.of("beneficiaire"), null, false
        );
    }

    @AfterEach
    void tearDown() {
    }

    @Test
    void statistiquesDistribution_necessite_authentification() throws Exception {
        mockMvc.perform(get("/api/statistiques/distributions/00000000-0000-0000-0000-000000000000"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void statistiquesDistribution_interditAuxBeneficiaires() throws Exception {
        mockMvc.perform(get("/api/statistiques/distributions/00000000-0000-0000-0000-000000000000")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
    }

    @Test
    void statistiquesDistribution_retourne404SiAucuneStatPourCetteDistribution() throws Exception {
        mockMvc.perform(get("/api/statistiques/distributions/00000000-0000-0000-0000-000000000000")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isNotFound());
    }

    @Test
    void statistiquesDistribution_retourneStatsApresInsertionDirecte() throws Exception {
        UUID distId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 6, 10);

        jdbcTemplate.update(
            "INSERT INTO statistique_distribution "
                + "(distribution_id, distribution_date, nb_inscrits_beneficiaires, "
                + "nb_inscrits_benevoles, nb_presents_beneficiaires, "
                + "nb_absents_beneficiaires, nb_non_pointes, taux_presence) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            distId, date, 80, 12, 70, 5, 5, 87.50
        );

        mockMvc.perform(get("/api/statistiques/distributions/" + distId)
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.distributionId").value(distId.toString()))
            .andExpect(jsonPath("$.nbInscritsBeneficiaires").value(80))
            .andExpect(jsonPath("$.nbPresentsBeneficiaires").value(70))
            .andExpect(jsonPath("$.tauxPresence").value(87.50));
    }

    @Test
    void statistiquesPeriode_retourneAgregatSurPeriode() throws Exception {
        // aggregerPeriode lit la table distribution (statut TERMINEE), pas le snapshot
        String insertDist = "INSERT INTO distribution "
            + "(id, titre, date, statut, capacite_beneficiaires, cree_par_id) "
            + "VALUES (?, ?, ?, 'TERMINEE', 50, ?)";
        jdbcTemplate.update(insertDist,
            UUID.randomUUID(), "Distribution mai 1", LocalDate.of(2026, 5, 10), responsableId);
        jdbcTemplate.update(insertDist,
            UUID.randomUUID(), "Distribution mai 2", LocalDate.of(2026, 5, 20), responsableId);

        mockMvc.perform(get("/api/statistiques/periode")
                .cookie(new Cookie("access_token", tokenResponsable))
                .param("debut", "2026-05-01")
                .param("fin", "2026-05-31"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nbDistributions").value(2))
            .andExpect(jsonPath("$.debut").value("2026-05-01"))
            .andExpect(jsonPath("$.fin").value("2026-05-31"));
    }

    @Test
    void listeStatsDistributions_retourneListeVideSiAucuneSurPeriode() throws Exception {
        mockMvc.perform(get("/api/statistiques/distributions")
                .cookie(new Cookie("access_token", tokenResponsable))
                .param("debut", "2025-01-01")
                .param("fin", "2025-01-31"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void listeStatsDistributions_necessiteParamsDebutFin() throws Exception {
        mockMvc.perform(get("/api/statistiques/distributions")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }
}
