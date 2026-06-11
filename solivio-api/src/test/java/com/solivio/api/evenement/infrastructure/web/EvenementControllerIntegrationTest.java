package com.solivio.api.evenement.infrastructure.web;

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
class EvenementControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private TenantFlywayMigrator flywayMigrator;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String schema;
    private String tokenAdmin;
    private String tokenBenevole;
    private String tokenBeneficiaire;
    private UUID personneId;
    private UUID benevoleId;
    private UUID beneficiaireId;

    private static final String TENANT = "evenement-test";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        schema = TenantProvisioningService.schemaName(TENANT);
        try {
            jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        } catch (Exception ignored) {}
        associationRepository.findAll().stream()
            .filter(a -> TENANT.equals(a.getSlug()))
            .forEach(associationRepository::delete);

        association = new Association(TENANT, "Asso Evenement Test");
        association.setCode("EVTEST");
        associationRepository.save(association);

        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
        flywayMigrator.migrate(schema);

        personneId = UUID.randomUUID();
        benevoleId = UUID.randomUUID();
        beneficiaireId = UUID.randomUUID();

        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".personne (id, nom, prenom, email, compte_email) VALUES (?, ?, ?, ?, ?)",
            personneId, "Admin", "Test", "admin@ev.com", "admin@ev.com"
        );
        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".personne (id, nom, prenom, email, compte_email) VALUES (?, ?, ?, ?, ?)",
            benevoleId, "Ben", "Evole", "ben@ev.com", "ben@ev.com"
        );
        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".personne (id, nom, prenom, email, compte_email) VALUES (?, ?, ?, ?, ?)",
            beneficiaireId, "Benef", "Test", "benef@ev.com", "benef@ev.com"
        );

        tokenAdmin = jwtService.genererAccessToken(
            UUID.randomUUID(), "admin@ev.com", "Admin", "Test",
            TENANT, List.of("responsable"), null, false
        );
        tokenBenevole = jwtService.genererAccessToken(
            UUID.randomUUID(), "ben@ev.com", "Ben", "Evole",
            TENANT, List.of("benevole"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@ev.com", "Benef", "Test",
            TENANT, List.of("beneficiaire"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        try {
            jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        } catch (Exception ignored) {}
        try {
            associationRepository.delete(association);
        } catch (Exception ignored) {}
    }

    @Test
    void creer_retourne201AvecStatutBrouillon() throws Exception {
        mockMvc.perform(post("/api/evenements")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Fete de printemps",
                      "type": "FETE",
                      "dateHeureDebut": "2026-09-01T14:00:00+02:00",
                      "dateHeureFin": "2026-09-01T20:00:00+02:00",
                      "aBesoiNStaff": true,
                      "ouvertParticipants": true,
                      "publicParticipants": "TOUS",
                      "modeInscription": "OBLIGATOIRE",
                      "capaciteStaff": 5,
                      "capaciteParticipants": 50
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.titre").value("Fete de printemps"))
            .andExpect(jsonPath("$.statut").value("BROUILLON"))
            .andExpect(jsonPath("$.type").value("FETE"));
    }

    @Test
    void creer_refuseBenevole() throws Exception {
        mockMvc.perform(post("/api/evenements")
                .cookie(new Cookie("access_token", tokenBenevole))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Test", "type": "AUTRE",
                      "dateHeureDebut": "2026-09-01T14:00:00+02:00",
                      "dateHeureFin": "2026-09-01T20:00:00+02:00"
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void publierEtInscrireStaff_parcoursBenevole() throws Exception {
        // Creation
        String body = mockMvc.perform(post("/api/evenements")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Stand solidaire",
                      "type": "STAND",
                      "dateHeureDebut": "2026-09-05T09:00:00+02:00",
                      "dateHeureFin": "2026-09-05T17:00:00+02:00",
                      "aBesoiNStaff": true,
                      "ouvertParticipants": false,
                      "modeInscription": "LIBRE",
                      "capaciteStaff": 10
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.fasterxml.jackson.databind.json.JsonMapper
            .builder().build().readTree(body).get("id").asText();

        // Publication
        mockMvc.perform(put("/api/evenements/" + id + "/publier")
                .cookie(new Cookie("access_token", tokenAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PUBLIE"));

        // Inscription staff par benevole
        mockMvc.perform(post("/api/evenements/" + id + "/participations")
                .cookie(new Cookie("access_token", tokenBenevole))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"role": "STAFF"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.role").value("STAFF"));
    }

    @Test
    void inscrireStaff_refuseSiBeneficiaire() throws Exception {
        // Creation + publication
        String body = mockMvc.perform(post("/api/evenements")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Stand test",
                      "type": "STAND",
                      "dateHeureDebut": "2026-09-10T09:00:00+02:00",
                      "dateHeureFin": "2026-09-10T17:00:00+02:00",
                      "aBesoiNStaff": true,
                      "ouvertParticipants": false,
                      "modeInscription": "LIBRE"
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.fasterxml.jackson.databind.json.JsonMapper
            .builder().build().readTree(body).get("id").asText();

        mockMvc.perform(put("/api/evenements/" + id + "/publier")
                .cookie(new Cookie("access_token", tokenAdmin)))
            .andExpect(status().isOk());

        // Beneficiaire essaie de s'inscrire comme staff → 409 attendu
        mockMvc.perform(post("/api/evenements/" + id + "/participations")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"role": "STAFF"}
                    """))
            .andExpect(status().isConflict());
    }

    @Test
    void annuler_retourneStatutANNULE() throws Exception {
        String body = mockMvc.perform(post("/api/evenements")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Evenement a annuler",
                      "type": "AUTRE",
                      "dateHeureDebut": "2026-10-01T10:00:00+02:00",
                      "dateHeureFin": "2026-10-01T12:00:00+02:00"
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.fasterxml.jackson.databind.json.JsonMapper
            .builder().build().readTree(body).get("id").asText();

        mockMvc.perform(put("/api/evenements/" + id + "/annuler")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"raison": "Manque de benevoles"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("ANNULE"))
            .andExpect(jsonPath("$.raisonAnnulation").value("Manque de benevoles"));
    }

    @Test
    void seDesinscrire_retourne204() throws Exception {
        // Creation + publication
        String body = mockMvc.perform(post("/api/evenements")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Evenement desinscription",
                      "type": "AUTRE",
                      "dateHeureDebut": "2026-10-05T10:00:00+02:00",
                      "dateHeureFin": "2026-10-05T12:00:00+02:00",
                      "aBesoiNStaff": true,
                      "modeInscription": "LIBRE"
                    }
                    """))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.fasterxml.jackson.databind.json.JsonMapper
            .builder().build().readTree(body).get("id").asText();

        mockMvc.perform(put("/api/evenements/" + id + "/publier")
                .cookie(new Cookie("access_token", tokenAdmin)))
            .andExpect(status().isOk());

        // Inscription
        mockMvc.perform(post("/api/evenements/" + id + "/participations")
                .cookie(new Cookie("access_token", tokenBenevole))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"role": "STAFF"}
                    """))
            .andExpect(status().isCreated());

        // Desinscription
        mockMvc.perform(delete("/api/evenements/" + id + "/participations/moi")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isNoContent());
    }

    @Test
    void lister_retourneLesEvenements() throws Exception {
        mockMvc.perform(post("/api/evenements")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "titre": "Evenement liste",
                      "type": "AUTRE",
                      "dateHeureDebut": "2026-11-01T10:00:00+02:00",
                      "dateHeureFin": "2026-11-01T12:00:00+02:00"
                    }
                    """))
            .andExpect(status().isCreated());

        mockMvc.perform(get("/api/evenements")
                .cookie(new Cookie("access_token", tokenAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].titre").value("Evenement liste"));
    }
}