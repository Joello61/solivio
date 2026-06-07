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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class RoleBenevoleControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private TenantFlywayMigrator flywayMigrator;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String tokenCoordinateur;
    private String tokenBeneficiaire;

    // UUID fictif : les tests de securite ne necessitent pas d'inscription reelle
    private static final String FAKE_DISTRIB_ID = "00000000-0000-0000-0000-000000000001";
    private static final String FAKE_INSCR_ID = "00000000-0000-0000-0000-000000000002";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        association = new Association("rb-test", "Asso RoleBenevole Test");
        association.setCode("RBTEST");
        associationRepository.save(association);

        String schema = TenantProvisioningService.schemaName("rb-test");
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
        flywayMigrator.migrate(schema);

        tokenCoordinateur = jwtService.genererAccessToken(
            UUID.randomUUID(), "coord@test.com", "Coord", "Test",
            "rb-test", List.of("coordinateur"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@test.com", "Benef", "Test",
            "rb-test", List.of("beneficiaire"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        String schema = TenantProvisioningService.schemaName("rb-test");
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        associationRepository.delete(association);
    }

    @Test
    void lister_retourne403PourBeneficiaire() throws Exception {
        mockMvc.perform(get("/api/distributions/" + FAKE_DISTRIB_ID
                + "/inscriptions/" + FAKE_INSCR_ID + "/roles")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
    }

    @Test
    void lister_retourne404PourCoordinateurSiInscriptionInexistante() throws Exception {
        mockMvc.perform(get("/api/distributions/" + FAKE_DISTRIB_ID
                + "/inscriptions/" + FAKE_INSCR_ID + "/roles")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isNotFound());
    }

    @Test
    void assigner_retourne403PourBeneficiaire() throws Exception {
        mockMvc.perform(post("/api/distributions/" + FAKE_DISTRIB_ID
                + "/inscriptions/" + FAKE_INSCR_ID + "/roles")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelleLibre\":\"accueil\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void assigner_retourne404PourCoordinateurSiInscriptionInexistante() throws Exception {
        mockMvc.perform(post("/api/distributions/" + FAKE_DISTRIB_ID
                + "/inscriptions/" + FAKE_INSCR_ID + "/roles")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelleLibre\":\"accueil\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void assigner_retourne401SiNonAuthentifie() throws Exception {
        mockMvc.perform(post("/api/distributions/" + FAKE_DISTRIB_ID
                + "/inscriptions/" + FAKE_INSCR_ID + "/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelleLibre\":\"accueil\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void retirer_retourne403PourBeneficiaire() throws Exception {
        String fakeRoleId = "00000000-0000-0000-0000-000000000003";
        mockMvc.perform(delete("/api/distributions/" + FAKE_DISTRIB_ID
                + "/inscriptions/" + FAKE_INSCR_ID + "/roles/" + fakeRoleId)
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
    }
}
