package com.solivio.api.collecte.infrastructure.web;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantFlywayMigrator;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class MissionCollecteControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private TenantFlywayMigrator flywayMigrator;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String tokenAdmin;
    private String tokenBenevole;
    private String schema;
    private UUID personneId;
    private UUID benevolePersonneId;

    private static final String TENANT = "collecte-test";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        // Nettoyage des residus d'un tearDown precedemment interrompu par deadlock
        schema = TenantProvisioningService.schemaName(TENANT);
        try {
            jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        } catch (Exception ignored) {}
        associationRepository.findAll().stream()
            .filter(a -> TENANT.equals(a.getSlug()))
            .forEach(associationRepository::delete);

        association = new Association(TENANT, "Asso Collecte Test");
        association.setCode("COLLTEST");
        associationRepository.save(association);

        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
        flywayMigrator.migrate(schema);

        personneId = UUID.randomUUID();
        benevolePersonneId = UUID.randomUUID();

        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".personne (id, nom, prenom, email, compte_email) VALUES (?, ?, ?, ?, ?)",
            personneId, "Admin", "Test", "admin@collecte.com", "admin@collecte.com"
        );
        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".personne (id, nom, prenom, email, compte_email) VALUES (?, ?, ?, ?, ?)",
            benevolePersonneId, "Ben", "Evole", "ben@collecte.com", "ben@collecte.com"
        );

        tokenAdmin = jwtService.genererAccessToken(
            UUID.randomUUID(), "admin@collecte.com", "Admin", "Test",
            TENANT, List.of("responsable"), null, false
        );
        tokenBenevole = jwtService.genererAccessToken(
            UUID.randomUUID(), "ben@collecte.com", "Ben", "Evole",
            TENANT, List.of("benevole"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        // Le DROP SCHEMA peut provoquer un deadlock sous execution parallele - on absorbe l'erreur.
        try {
            jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        } catch (Exception ignored) {}
        try {
            associationRepository.delete(association);
        } catch (Exception ignored) {}
    }

    @Test
    void creer_retourne201AvecLaMission() throws Exception {
        mockMvc.perform(post("/api/missions-collecte")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Collecte printemps",
                      "dateHeure": "2026-09-15T09:00:00+02:00",
                      "capacitePersonnes": 4
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.titre").value("Collecte printemps"))
            .andExpect(jsonPath("$.statut").value("DISPONIBLE"));
    }

    @Test
    void creer_refuseBenevole() throws Exception {
        mockMvc.perform(post("/api/missions-collecte")
                .cookie(new Cookie("access_token", tokenBenevole))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Collecte test",
                      "dateHeure": "2026-09-15T09:00:00+02:00"
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void lister_retourneLaMission() throws Exception {
        mockMvc.perform(post("/api/missions-collecte")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"titre":"Collecte A","dateHeure":"2026-09-15T09:00:00+02:00"}
                    """))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/missions-collecte")
                .cookie(new Cookie("access_token", tokenAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].titre").value("Collecte A"));
    }

    @Test
    void prendreEtValiderCollecteEtDepot_parcoursComplet() throws Exception {
        // Creation
        String body = mockMvc.perform(post("/api/missions-collecte")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"titre":"Collecte cycle","dateHeure":"2026-09-20T09:00:00+02:00"}
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String missionId = com.fasterxml.jackson.databind.json.JsonMapper
            .builder().build()
            .readTree(body).get("id").asText();

        // Prise en charge par le benevole
        mockMvc.perform(post("/api/missions-collecte/" + missionId + "/prendre")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PRISE_EN_CHARGE"));

        // Validation collecte par l'admin
        mockMvc.perform(put("/api/missions-collecte/" + missionId + "/valider-collecte")
                .cookie(new Cookie("access_token", tokenAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("COLLECTE_EFFECTUEE"));

        // Validation depot par le benevole
        mockMvc.perform(put("/api/missions-collecte/" + missionId + "/valider-depot")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("DEPOT_VALIDE"));
    }

    @Test
    void liberer_retourneADisponible() throws Exception {
        String body = mockMvc.perform(post("/api/missions-collecte")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"titre":"Collecte liberee","dateHeure":"2026-09-25T09:00:00+02:00"}
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String missionId = com.fasterxml.jackson.databind.json.JsonMapper
            .builder().build()
            .readTree(body).get("id").asText();

        mockMvc.perform(post("/api/missions-collecte/" + missionId + "/prendre")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isOk());

        mockMvc.perform(delete("/api/missions-collecte/" + missionId + "/liberer")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("DISPONIBLE"));
    }

    @Test
    void annuler_passeEnAnnulee() throws Exception {
        String body = mockMvc.perform(post("/api/missions-collecte")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"titre":"Collecte a annuler","dateHeure":"2026-09-28T09:00:00+02:00"}
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String missionId = com.fasterxml.jackson.databind.json.JsonMapper
            .builder().build()
            .readTree(body).get("id").asText();

        mockMvc.perform(put("/api/missions-collecte/" + missionId + "/annuler")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"raison":"Intemperies"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("ANNULEE"))
            .andExpect(jsonPath("$.raisonAnnulation").value("Intemperies"));
    }
}
