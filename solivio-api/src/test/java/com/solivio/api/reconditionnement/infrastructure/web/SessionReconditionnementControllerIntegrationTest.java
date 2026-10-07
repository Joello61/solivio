package com.solivio.api.reconditionnement.infrastructure.web;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class SessionReconditionnementControllerIntegrationTest {

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
    private String tokenResponsable;
    private String tokenBenevole;
    private UUID personneId;

    private static final String TENANT = "reco-test";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        personneId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) VALUES (?, ?, ?, ?)",
            personneId, "Resp", "Test", "resp@reco.com");

        tokenResponsable = jwtService.genererAccessToken(
            UUID.randomUUID(), "resp@reco.com", "Resp", "Test", List.of("responsable"), null, false
        );
        tokenBenevole = jwtService.genererAccessToken(
            UUID.randomUUID(), "benev@reco.com", "Benev", "Test", List.of("benevole"), null, false
        );
    }

    @AfterEach
    void tearDown() {
    }

    @Test
    void creer_necessiteAuthentification() throws Exception {
        mockMvc.perform(post("/api/sessions-reconditionnement")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void creer_necessiteRoleResponsable() throws Exception {
        String corps = "{\"titre\":\"Session test\","
            + "\"dateHeureDebut\":\"2026-12-01T10:00:00Z\","
            + "\"dateHeureFin\":\"2026-12-01T12:00:00Z\"}";
        mockMvc.perform(post("/api/sessions-reconditionnement")
                .cookie(new Cookie("access_token", tokenBenevole))
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps))
            .andExpect(status().isForbidden());
    }

    @Test
    void creer_echoueSiCorpsInvalide() throws Exception {
        mockMvc.perform(post("/api/sessions-reconditionnement")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void creer_retourne201AvecSessionEnBrouillon() throws Exception {
        String corps = "{\"titre\":\"Session tri automne\","
            + "\"dateHeureDebut\":\"2026-12-01T09:00:00Z\","
            + "\"dateHeureFin\":\"2026-12-01T12:00:00Z\","
            + "\"capacite\":15}";
        mockMvc.perform(post("/api/sessions-reconditionnement")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.titre").value("Session tri automne"))
            .andExpect(jsonPath("$.statut").value("BROUILLON"))
            .andExpect(jsonPath("$.capacite").value(15));
    }

    @Test
    void lister_retourneListe200() throws Exception {
        mockMvc.perform(get("/api/sessions-reconditionnement")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void detail_retourne404SiInexistante() throws Exception {
        mockMvc.perform(get("/api/sessions-reconditionnement/00000000-0000-0000-0000-000000000000")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isNotFound());
    }

    @Test
    void publier_echoueSiRoleInsuffisant() throws Exception {
        mockMvc.perform(post("/api/sessions-reconditionnement/00000000-0000-0000-0000-000000000000/publier")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isForbidden());
    }

    @Test
    void cycleDeVie_creerPuisPublier() throws Exception {
        // Creer
        String corps = "{\"titre\":\"Session cycle\","
            + "\"dateHeureDebut\":\"2026-12-10T09:00:00Z\","
            + "\"dateHeureFin\":\"2026-12-10T12:00:00Z\"}";
        String reponse = mockMvc.perform(post("/api/sessions-reconditionnement")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(reponse, "$.id");

        // Publier
        mockMvc.perform(post("/api/sessions-reconditionnement/" + id + "/publier")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PUBLIEE"));
    }

    @Test
    void inscrire_puis_desinscrire_benevole() throws Exception {
        // Creer et publier une session
        String corps = "{\"titre\":\"Session inscription\","
            + "\"dateHeureDebut\":\"2026-12-15T09:00:00Z\","
            + "\"dateHeureFin\":\"2026-12-15T12:00:00Z\"}";
        String reponse = mockMvc.perform(post("/api/sessions-reconditionnement")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content(corps))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(reponse, "$.id");

        mockMvc.perform(post("/api/sessions-reconditionnement/" + id + "/publier")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk());

        // Inscrire le benevole (son email est dans le token)
        UUID benevolePersonneId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) VALUES (?, ?, ?, ?)",
            benevolePersonneId, "Benev", "Test", "benev@reco.com");

        mockMvc.perform(post("/api/sessions-reconditionnement/" + id + "/inscrire")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("CONFIRMEE"));

        // Se desinscrire
        mockMvc.perform(delete("/api/sessions-reconditionnement/" + id + "/desinscrire")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isNoContent());
    }

    @Test
    void listerInscrits_necessiteRoleCoordinateur() throws Exception {
        mockMvc.perform(get("/api/sessions-reconditionnement/00000000-0000-0000-0000-000000000000/inscrits")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isForbidden());
    }
}
