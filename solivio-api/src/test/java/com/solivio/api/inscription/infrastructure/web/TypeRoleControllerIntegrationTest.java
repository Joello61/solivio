package com.solivio.api.inscription.infrastructure.web;

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
class TypeRoleControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private TenantFlywayMigrator flywayMigrator;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String tokenCoordinateur;
    private String tokenBeneficiaire;
    private String tokenResponsable;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        association = new Association("role-test", "Asso Role Test");
        association.setCode("ROLETEST");
        associationRepository.save(association);

        String schema = TenantProvisioningService.schemaName("role-test");
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
        flywayMigrator.migrate(schema);

        tokenCoordinateur = jwtService.genererAccessToken(
            UUID.randomUUID(), "coord@test.com", "Coord", "Test",
            "role-test", List.of("coordinateur"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@test.com", "Benef", "Test",
            "role-test", List.of("beneficiaire"), null, false
        );
        tokenResponsable = jwtService.genererAccessToken(
            UUID.randomUUID(), "resp@test.com", "Resp", "Test",
            "role-test", List.of("responsable"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        String schema = TenantProvisioningService.schemaName("role-test");
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        associationRepository.delete(association);
    }

    @Test
    void lister_retourne200PourNimporteQuelUtilisateurAuthentifie() throws Exception {
        mockMvc.perform(get("/api/types-roles")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void lister_retourne401SiNonAuthentifie() throws Exception {
        mockMvc.perform(get("/api/types-roles"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void creer_retourne201PourCoordinateur() throws Exception {
        mockMvc.perform(post("/api/types-roles")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Distribution\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.libelle").value("Distribution"))
            .andExpect(jsonPath("$.actif").value(true))
            .andExpect(jsonPath("$.parentId").doesNotExist());
    }

    @Test
    void creer_retourne403PourBeneficiaire() throws Exception {
        mockMvc.perform(post("/api/types-roles")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Distribution\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void creer_sousTypeAvecParentExistant() throws Exception {
        // Creer le parent d'abord
        String parentJson = mockMvc.perform(post("/api/types-roles")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Distribution\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String parentId = com.jayway.jsonpath.JsonPath.read(parentJson, "$.id");

        mockMvc.perform(post("/api/types-roles")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Distribution des patates\",\"parentId\":\"" + parentId + "\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.libelle").value("Distribution des patates"))
            .andExpect(jsonPath("$.parentId").value(parentId));
    }

    @Test
    void modifier_retourne200PourCoordinateur() throws Exception {
        String created = mockMvc.perform(post("/api/types-roles")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Accueil\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mockMvc.perform(put("/api/types-roles/" + id)
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Accueil modifie\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.libelle").value("Accueil modifie"));
    }

    @Test
    void archiver_retourne204PourResponsable() throws Exception {
        String created = mockMvc.perform(post("/api/types-roles")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Logistique\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mockMvc.perform(delete("/api/types-roles/" + id)
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isNoContent());
    }

    @Test
    void archiver_retourne403PourCoordinateur() throws Exception {
        String created = mockMvc.perform(post("/api/types-roles")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Logistique\"}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String id = com.jayway.jsonpath.JsonPath.read(created, "$.id");

        mockMvc.perform(delete("/api/types-roles/" + id)
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isForbidden());
    }
}
