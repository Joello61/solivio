package com.solivio.api.association.infrastructure.web;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class AssociationControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private TenantFlywayMigrator flywayMigrator;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String schema;
    private String tokenResponsable;
    private String tokenBeneficiaire;
    private UUID compteResponsableId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        association = new Association("asso-config-test", "Association Config Test");
        association.setCode("ASSOCFG");
        associationRepository.save(association);

        schema = TenantProvisioningService.schemaName("asso-config-test");
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
        flywayMigrator.migrate(schema);

        compteResponsableId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO \"" + schema + "\".personne (id, nom, prenom, email, compte_email) "
                + "VALUES (?, 'Resp', 'Config', 'resp@cfg.com', 'resp@cfg.com')",
            compteResponsableId
        );
        // Affiliation dans public.affiliation
        jdbcTemplate.update(
            "INSERT INTO public.compte (id, email, password_hash, nom, prenom, email_verifie) "
                + "VALUES (?, ?, 'hash', 'Resp', 'Config', true)",
            compteResponsableId, "resp@cfg.com"
        );
        jdbcTemplate.update(
            "INSERT INTO public.affiliation (compte_id, association_id, role) "
                + "VALUES (?, ?, 'responsable')",
            compteResponsableId, association.getId()
        );

        tokenResponsable = jwtService.genererAccessToken(
            compteResponsableId, "resp@cfg.com", "Resp", "Config",
            "asso-config-test", List.of("responsable"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@cfg.com", "Benef", "Test",
            "asso-config-test", List.of("beneficiaire"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        jdbcTemplate.update("DELETE FROM public.affiliation WHERE compte_id = ?", compteResponsableId);
        jdbcTemplate.update("DELETE FROM public.compte WHERE id = ?", compteResponsableId);
        associationRepository.delete(association);
    }

    @Test
    void lireAssociation_retourneConfigComplete() throws Exception {
        mockMvc.perform(get("/api/association")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.slug").value("asso-config-test"))
            .andExpect(jsonPath("$.nom").value("Association Config Test"))
            .andExpect(jsonPath("$.couleurPrimaire").value("#16513F"));
    }

    @Test
    void lireAssociation_necessiteAuthentification() throws Exception {
        mockMvc.perform(get("/api/association"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void lireAssociation_interditAuxBeneficiaires() throws Exception {
        mockMvc.perform(get("/api/association")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
    }

    @Test
    void mettreAJourAssociation_miseAJourNomEtCouleurs() throws Exception {
        mockMvc.perform(patch("/api/association")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"Nouveau Nom\","
                    + "\"couleurPrimaire\":\"#FF0000\","
                    + "\"fuseauHoraire\":\"Europe/London\","
                    + "\"frequenceMaxParSemaine\":2}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nom").value("Nouveau Nom"))
            .andExpect(jsonPath("$.couleurPrimaire").value("#FF0000"))
            .andExpect(jsonPath("$.fuseauHoraire").value("Europe/London"))
            .andExpect(jsonPath("$.frequenceMaxParSemaine").value(2));
    }

    @Test
    void mettreAJourAssociation_interditAuxBeneficiaires() throws Exception {
        mockMvc.perform(patch("/api/association")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"Hack\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void listerMembres_retourneLeMembre() throws Exception {
        mockMvc.perform(get("/api/association/membres")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].email").value("resp@cfg.com"))
            .andExpect(jsonPath("$[0].role").value("responsable"));
    }

    @Test
    void supprimerMembre_desactiveLeCompte() throws Exception {
        mockMvc.perform(delete("/api/association/membres/" + compteResponsableId)
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isNoContent());
    }

    @Test
    void exporterAssociation_retourneZip() throws Exception {
        mockMvc.perform(get("/api/association/export")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk())
            .andExpect(result ->
                org.assertj.core.api.Assertions.assertThat(
                    result.getResponse().getContentType()
                ).contains("application/octet-stream")
            );
    }
}
