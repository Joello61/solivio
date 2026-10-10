package com.solivio.api.distribution.infrastructure.web;

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

import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class DistributionControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AssociationRepository associationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String tokenCoordinateur;
    private String tokenBeneficiaire;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        UUID compteId = UUID.randomUUID();
        tokenCoordinateur = jwtService.genererAccessToken(
            compteId, "coord@test.com", "Coord", "Test", List.of("coordinateur"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@test.com", "Benef", "Test", List.of("beneficiaire"), null, false
        );
    }

    @AfterEach
    void tearDown() {
    }

    @Test
    void creer_necessiteAuthentification() throws Exception {
        mockMvc.perform(post("/api/distributions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void creer_echoueSiCorpsInvalide() throws Exception {
        mockMvc.perform(post("/api/distributions")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void creer_necessiteRoleCoordinateur() throws Exception {
        // Le corps doit etre syntaxiquement valide pour que le controle de role (@PreAuthorize AOP)
        // s'execute apres le parsing. Sinon on obtient 400 avant le 403.
        String corps = "{\"titre\":\"T\",\"date\":\"2026-12-01\","
            + "\"capaciteBeneficiaires\":10,"
            + "\"creneaux\":[{\"heureDebut\":\"10:00\",\"heureFin\":\"12:00\",\"capacite\":10}]}";
        mockMvc.perform(post("/api/distributions")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps))
            .andExpect(status().isForbidden());
    }

    @Test
    void lister_retourneListe200() throws Exception {
        mockMvc.perform(get("/api/distributions")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void detail_retourne404SiInexistante() throws Exception {
        mockMvc.perform(get("/api/distributions/00000000-0000-0000-0000-000000000000")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isNotFound());
    }

    @Test
    void publier_echoueSiRoleInsuffisant() throws Exception {
        mockMvc.perform(post("/api/distributions/00000000-0000-0000-0000-000000000000/publier")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
    }

    // I8 : entrees bornees et coherentes, 400 et non 500.
    @Test
    void creer_refuseLesEntreesInvalides() throws Exception {
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Coord', 'Test', ?)",
            UUID.randomUUID(), "coord@test.com");
        String dans3Jours = java.time.LocalDate.now().plusDays(3).toString();
        String creneau = "\"creneaux\":[{\"heureDebut\":\"10:00\",\"heureFin\":\"12:00\",\"capacite\":10}]";

        creerDistribution("{\"titre\":\"T\",\"date\":\"" + dans3Jours + "\",\"capaciteBeneficiaires\":10,"
            + "\"description\":\"" + "x".repeat(2001) + "\"," + creneau + "}");
        creerDistribution("{\"titre\":\"T\",\"date\":\"" + dans3Jours + "\",\"capaciteBeneficiaires\":10,"
            + "\"capaciteBenevoles\":-1," + creneau + "}");
        creerDistribution("{\"titre\":\"T\",\"date\":\"" + java.time.LocalDate.now().minusDays(2)
            + "\",\"capaciteBeneficiaires\":10," + creneau + "}");
        creerDistribution("{\"titre\":\"T\",\"date\":\"" + dans3Jours + "\",\"capaciteBeneficiaires\":10,"
            + "\"modeCreneau\":\"CRENEAU_UNIQUE\",\"creneaux\":["
            + "{\"heureDebut\":\"10:00\",\"heureFin\":\"11:00\",\"capacite\":5},"
            + "{\"heureDebut\":\"11:00\",\"heureFin\":\"12:00\",\"capacite\":5}]}");
    }

    private void creerDistribution(String corps) throws Exception {
        mockMvc.perform(post("/api/distributions")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps))
            .andExpect(status().isBadRequest());
    }

    // I4 : un brouillon n'existe pas pour qui ne gere pas les distributions.
    @Test
    void detail_brouillon_introuvablePourUnBeneficiaire() throws Exception {
        UUID brouillon = insererDistribution("BROUILLON");

        mockMvc.perform(get("/api/distributions/" + brouillon)
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/distributions/" + brouillon)
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isOk());
    }

    @Test
    void detail_publiee_visiblePourUnBeneficiaire() throws Exception {
        UUID publiee = insererDistribution("PUBLIEE");

        mockMvc.perform(get("/api/distributions/" + publiee)
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PUBLIEE"));
    }

    // I11 : a venir et du jour seulement, en cours comprises, de la plus proche a la plus lointaine.
    @Test
    void lister_pourUnBeneficiaire_distributionsAVenirTrieesParDate() throws Exception {
        UUID passee = insererDistribution("PUBLIEE", -3);
        UUID dans10Jours = insererDistribution("PUBLIEE", 10);
        UUID enCours = insererDistribution("EN_COURS", 0);
        UUID dans2Jours = insererDistribution("PUBLIEE", 2);
        insererDistribution("BROUILLON", 4);

        String corps = mockMvc.perform(get("/api/distributions")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        List<String> ids = com.jayway.jsonpath.JsonPath.read(corps, "$[*].id");
        org.assertj.core.api.Assertions.assertThat(ids)
            .containsExactly(enCours.toString(), dans2Jours.toString(), dans10Jours.toString())
            .doesNotContain(passee.toString());
    }

    private UUID insererDistribution(String statut) {
        return insererDistribution(statut, 7);
    }

    private UUID insererDistribution(String statut, int dansJours) {
        UUID createur = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Coord', 'Test', ?)",
            createur, createur + "@test.com");
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, mode_creneau, "
                + "base_repartition, cree_par_id) VALUES (?, 'Distribution', CURRENT_DATE + ?, ?, 10, "
                + "'CRENEAU_UNIQUE', 'INSCRITS', ?)",
            id, dansJours, statut, createur);
        return id;
    }
}
