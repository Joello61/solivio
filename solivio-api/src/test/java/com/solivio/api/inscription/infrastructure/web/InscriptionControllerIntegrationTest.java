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

import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class InscriptionControllerIntegrationTest {

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
    private String tokenBenevole;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        tokenCoordinateur = jwtService.genererAccessToken(
            UUID.randomUUID(), "coord@test.com", "Coord", "Test", List.of("coordinateur"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@test.com", "Benef", "Test", List.of("beneficiaire"), null, false
        );
        tokenBenevole = jwtService.genererAccessToken(
            UUID.randomUUID(), "ben@test.com", "Ben", "Test", List.of("benevole"), null, false
        );
    }

    @AfterEach
    void tearDown() {
    }

    @Test
    void inscrire_necessiteAuthentification() throws Exception {
        mockMvc.perform(post("/api/distributions/00000000-0000-0000-0000-000000000000/inscriptions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"BENEFICIAIRE\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void inscrire_retourne404SiDistributionInexistante() throws Exception {
        mockMvc.perform(post("/api/distributions/00000000-0000-0000-0000-000000000000/inscriptions")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"type\":\"BENEFICIAIRE\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void listerInscrits_necessiteRoleCoordinateur() throws Exception {
        mockMvc.perform(get("/api/distributions/00000000-0000-0000-0000-000000000000/inscriptions")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
    }

    @Test
    void mesInscriptions_retourneListe200() throws Exception {
        mockMvc.perform(get("/api/distributions/00000000-0000-0000-0000-000000000000/inscriptions/mes")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void mesInscriptions_indiqueLeStatutDeLaDistribution() throws Exception {
        UUID personne = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Benef', 'Test', 'benef@test.com')",
            personne);
        UUID distribution = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, mode_creneau, "
            + "base_repartition, cree_par_id) VALUES (?, 'Distribution', CURRENT_DATE, 'TERMINEE', 10, "
            + "'CRENEAU_UNIQUE', 'INSCRITS', ?)", distribution, personne);
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type, statut) "
            + "VALUES (?, ?, ?, 'Benef', 'Test', 'BENEFICIAIRE', 'CONFIRMEE')", UUID.randomUUID(), distribution, personne);

        mockMvc.perform(get("/api/inscriptions/mes").cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].distributionStatut").value("TERMINEE"));
    }

    @Test
    void mesInscriptions_donneLHoraireDuRendezVousEtLeLieu() throws Exception {
        UUID personne = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Benef', 'Test', 'benef@test.com')",
            personne);
        UUID decoupee = distribution(personne, "CRENEAUX_DECOUPES", 1);
        creneau(decoupee, "10:00");
        UUID suite = creneau(decoupee, "11:00");
        UUID unique = distribution(personne, "CRENEAU_UNIQUE", 2);
        creneau(unique, "17:30");
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, creneau_id, personne_id, nom, prenom, type, "
            + "statut) VALUES (?, ?, ?, ?, 'Benef', 'Test', 'BENEFICIAIRE', 'CONFIRMEE')",
            UUID.randomUUID(), decoupee, suite, personne);
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type, statut) "
            + "VALUES (?, ?, ?, 'Benef', 'Test', 'BENEVOLE', 'CONFIRMEE')", UUID.randomUUID(), unique, personne);

        mockMvc.perform(get("/api/inscriptions/mes").cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.type == 'BENEFICIAIRE')].heureDebut").value("11:00:00"))
            .andExpect(jsonPath("$[?(@.type == 'BENEFICIAIRE')].heureFin").value("12:00:00"))
            .andExpect(jsonPath("$[?(@.type == 'BENEFICIAIRE')].distributionLieuNom").value("Local Rangueil"))
            .andExpect(jsonPath("$[?(@.type == 'BENEVOLE')].heureDebut").value("17:30:00"));
    }

    private UUID distribution(UUID createur, String mode, int dansJours) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, mode_creneau, "
            + "base_repartition, cree_par_id, lieu_nom) VALUES (?, 'Distribution', CURRENT_DATE + ?, 'PUBLIEE', 10, "
            + "?, 'INSCRITS', ?, 'Local Rangueil')", id, dansJours, mode, createur);
        return id;
    }

    private UUID creneau(UUID distribution, String debut) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO creneau (id, distribution_id, heure_debut, heure_fin, capacite) "
            + "VALUES (?, ?, ?::time, ?::time + interval '1 hour', 5)", id, distribution, debut, debut);
        return id;
    }

    @Test
    void pointage_necessiteRoleCoordinateurOuBenevole() throws Exception {
        mockMvc.perform(get("/api/distributions/00000000-0000-0000-0000-000000000000/pointage")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
    }

    @Test
    void pointage_retourneListe200PourCoordinateur() throws Exception {
        mockMvc.perform(get("/api/distributions/00000000-0000-0000-0000-000000000000/pointage")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .param("q", "Marie"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    // ADR-012 : le pointage est reserve aux coordinateurs et responsables.
    @Test
    void pointage_refuseAUnBenevole() throws Exception {
        mockMvc.perform(get("/api/distributions/00000000-0000-0000-0000-000000000000/pointage")
                .cookie(new Cookie("access_token", tokenBenevole))
                .param("q", ""))
            .andExpect(status().isForbidden());
    }
}
