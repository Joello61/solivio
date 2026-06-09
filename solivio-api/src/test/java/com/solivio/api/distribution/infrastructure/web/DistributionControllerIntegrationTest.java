package com.solivio.api.distribution.infrastructure.web;

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
    private TenantFlywayMigrator flywayMigrator;

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

        association = new Association("dist-test", "Asso Distribution Test");
        association.setCode("DISTTEST");
        associationRepository.save(association);

        String schema = TenantProvisioningService.schemaName("dist-test");
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
        flywayMigrator.migrate(schema);

        UUID compteId = UUID.randomUUID();
        tokenCoordinateur = jwtService.genererAccessToken(
            compteId, "coord@test.com", "Coord", "Test",
            "dist-test", List.of("coordinateur"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@test.com", "Benef", "Test",
            "dist-test", List.of("beneficiaire"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        String schema = TenantProvisioningService.schemaName("dist-test");
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        associationRepository.delete(association);
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
}
