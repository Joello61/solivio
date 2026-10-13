package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ADR-011 : hierarchie responsable > coordinateur > benevole, beneficiaire a part,
 * plus de role admin.
 */
@SolivioIntegrationTest
class HierarchieRolesIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void coordinateur_peutPrendreUneMissionReserveeAuxBenevoles() throws Exception {
        String mission = creerMission();

        mockMvc.perform(post("/api/missions-collecte/" + mission + "/prendre")
                .cookie(jeton("coord@roles.test", "coordinateur")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PRISE_EN_CHARGE"));
    }

    @Test
    void responsable_peutPrendreUneMissionReserveeAuxBenevoles() throws Exception {
        String mission = creerMission();

        mockMvc.perform(post("/api/missions-collecte/" + mission + "/prendre")
                .cookie(jeton("resp2@roles.test", "responsable")))
            .andExpect(status().isOk());
    }

    @Test
    void beneficiaire_resteHorsHierarchie() throws Exception {
        String mission = creerMission();

        mockMvc.perform(post("/api/missions-collecte/" + mission + "/prendre")
                .cookie(jeton("benef@roles.test", "beneficiaire")))
            .andExpect(status().isForbidden());
    }

    // La hierarchie ne vaut que vers le bas.
    @Test
    void benevole_nHeritePasDesDroitsDuCoordinateur() throws Exception {
        mockMvc.perform(post("/api/types-roles")
                .cookie(jeton("ben@roles.test", "benevole"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"libelle": "Accueil"}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void coordinateur_nHeritePasDesDroitsDuResponsable() throws Exception {
        mockMvc.perform(delete("/api/types-roles/" + UUID.randomUUID())
                .cookie(jeton("coord@roles.test", "coordinateur")))
            .andExpect(status().isForbidden());
    }

    @Test
    void coordinateur_nAPasAccesALaGestionDesMembres() throws Exception {
        mockMvc.perform(get("/api/association/membres")
                .cookie(jeton("coord@roles.test", "coordinateur")))
            .andExpect(status().isForbidden());
    }

    // Un jeton emis avant la suppression du role ne donne plus aucun droit.
    @Test
    void ancienRoleAdmin_neDonnePlusAccesALEmailLibre() throws Exception {
        mockMvc.perform(post("/api/notifications/email-libre")
                .cookie(jeton("admin@roles.test", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"cible": "BENEVOLES", "sujet": "Info", "corps": "Corps"}
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void invitation_refuseLeRoleAdmin() throws Exception {
        mockMvc.perform(post("/api/invitations")
                .cookie(jeton("resp@roles.test", "responsable"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "nouveau@roles.test", "role": "admin"}
                    """))
            .andExpect(status().isBadRequest());
    }

    private String creerMission() throws Exception {
        String body = mockMvc.perform(post("/api/missions-collecte")
                .cookie(jeton("resp@roles.test", "responsable"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"titre": "Collecte", "dateHeure": "2026-12-15T09:00:00+01:00"}
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return JsonMapper.builder().build().readTree(body).get("id").asString();
    }

    private Cookie jeton(String email, String role) {
        Integer existe = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM personne WHERE email = ?", Integer.class, email);
        if (existe == 0) {
            jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Nom', 'Prenom', ?)",
                UUID.randomUUID(), email);
        }
        return new Cookie("access_token",
            jwtService.genererAccessToken(UUID.randomUUID(), email, "Nom", "Prenom", List.of(role), null, false));
    }
}
