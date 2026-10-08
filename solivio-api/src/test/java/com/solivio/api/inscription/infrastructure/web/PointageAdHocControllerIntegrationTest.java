package com.solivio.api.inscription.infrastructure.web;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class PointageAdHocControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String tokenCoordinateur;
    private String tokenBenevole;
    private UUID distributionId;
    private UUID personneId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        tokenCoordinateur = jwtService.genererAccessToken(
            UUID.randomUUID(), "coord@adhoc.com", "Coord", "Test", List.of("coordinateur"), null, false
        );
        tokenBenevole = jwtService.genererAccessToken(
            UUID.randomUUID(), "benevole@adhoc.com", "Bene", "Vole", List.of("benevole"), null, false
        );

        // Inserer une distribution EN_COURS
        distributionId = UUID.randomUUID();
        personneId = UUID.randomUUID();

        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) VALUES (?, ?, ?, ?)",
            personneId, "Dupont", "Alice", "alice@adhoc.com"
        );
        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) VALUES (?, ?, ?, ?)",
            UUID.randomUUID(), "Coord", "Test", "coord@adhoc.com"
        );
        jdbcTemplate.update(
            "INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, mode_creneau, "
                + "base_repartition, cree_par_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            distributionId, "Distrib Test", LocalDate.now(), "EN_COURS",
            50, "CRENEAU_UNIQUE", "INSCRITS", personneId
        );

    }

    @AfterEach
    void tearDown() {
    }

    @Test
    void ajouterVisiteur_retourne401SiNonAuthentifie() throws Exception {
        mockMvc.perform(post("/api/distributions/" + distributionId + "/pointage/ad-hoc/visiteur")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"Durand\",\"prenom\":\"Bob\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void ajouterVisiteur_retourne403PourBenevole() throws Exception {
        mockMvc.perform(post("/api/distributions/" + distributionId + "/pointage/ad-hoc/visiteur")
                .cookie(new Cookie("access_token", tokenBenevole))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"Durand\",\"prenom\":\"Bob\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void ajouterVisiteur_retourne201PourCoordinateur() throws Exception {
        mockMvc.perform(post("/api/distributions/" + distributionId + "/pointage/ad-hoc/visiteur")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"Durand\",\"prenom\":\"Bob\",\"email\":\"bob@test.com\",\"role\":\"Accueil\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.nom").value("Durand"))
            .andExpect(jsonPath("$.prenom").value("Bob"))
            .andExpect(jsonPath("$.presence").value("PRESENT"))
            .andExpect(jsonPath("$.invitationEnvoyee").value(false));
    }

    @Test
    void ajouterVisiteur_retourne400SiNomManquant() throws Exception {
        mockMvc.perform(post("/api/distributions/" + distributionId + "/pointage/ad-hoc/visiteur")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"prenom\":\"Bob\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void lister_retourne200PourCoordinateur() throws Exception {
        mockMvc.perform(get("/api/distributions/" + distributionId + "/pointage/ad-hoc")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void rechercherMembres_retourne200PourCoordinateur() throws Exception {
        mockMvc.perform(get("/api/distributions/" + distributionId + "/pointage/ad-hoc/membres?q=Alice")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].nom").value("Dupont"))
            .andExpect(jsonPath("$[0].prenom").value("Alice"));
    }

    @Test
    void ajouterBenevoleExistant_retourne201PourCoordinateur() throws Exception {
        mockMvc.perform(post("/api/distributions/" + distributionId + "/pointage/ad-hoc/benevole-existant")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"personneId\":\"" + personneId + "\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.presence").value("PRESENT"))
            .andExpect(jsonPath("$.type").value("BENEVOLE"));
    }
}
