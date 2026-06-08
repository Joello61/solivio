package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.InvitationRepository;
import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class AdminAssociationControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private CompteRepository compteRepository;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private InvitationRepository invitationRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private Compte superAdmin;
    private Compte responsable;
    private String tokenSuperAdmin;
    private String tokenNonAdmin;
    private Association associationExistante;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        superAdmin = new Compte("sadmin-assoc@solivio.app",
            passwordEncoder.encode("pass"), "Admin", "Super");
        superAdmin.setEmailVerifie(true);
        superAdmin.setSuperAdmin(true);
        compteRepository.save(superAdmin);

        responsable = new Compte("resp-assoc@solivio.app",
            passwordEncoder.encode("pass"), "Resp", "Test");
        responsable.setEmailVerifie(true);
        compteRepository.save(responsable);

        associationExistante = new Association("existante-ci", "Association Existante CI");
        associationRepository.save(associationExistante);

        tokenSuperAdmin = jwtService.genererAccessToken(
            superAdmin.getId(), superAdmin.getEmail(), superAdmin.getNom(), superAdmin.getPrenom(),
            null, List.of("ROLE_SUPER_ADMIN"), null, true
        );
        tokenNonAdmin = jwtService.genererAccessToken(
            responsable.getId(), responsable.getEmail(), responsable.getNom(), responsable.getPrenom(),
            null, List.of("ROLE_RESPONSABLE"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        invitationRepository.deleteAll();
        associationRepository.findAll().stream()
            .filter(a -> !"existante-ci".equals(a.getSlug()))
            .forEach(a -> {
                String schema = TenantProvisioningService.schemaName(a.getSlug());
                jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
                associationRepository.delete(a);
            });
        associationRepository.delete(associationExistante);
        compteRepository.delete(responsable);
        compteRepository.delete(superAdmin);
    }

    @Test
    void lister_retourneListeDesAssociations() throws Exception {
        mockMvc.perform(get("/api/admin/associations")
                .cookie(new Cookie("access_token", tokenSuperAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }

    @Test
    void lister_refuse403PourNonSuperAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/associations")
                .cookie(new Cookie("access_token", tokenNonAdmin)))
            .andExpect(status().isForbidden());
    }

    @Test
    void creer_retourne201ProvisioneLeSchemaEtEnvoieInvitation() throws Exception {
        String body = """
            {"nom":"Asso Pilote","slug":"pilote-ci","emailResponsable":"resp@pilote-ci.fr"}
            """;

        mockMvc.perform(post("/api/admin/associations")
                .cookie(new Cookie("access_token", tokenSuperAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.slug").value("pilote-ci"))
            .andExpect(jsonPath("$.nom").value("Asso Pilote"))
            .andExpect(jsonPath("$.code").isString())
            .andExpect(jsonPath("$.statut").value("active"));

        assertThat(associationRepository.findBySlug("pilote-ci")).isPresent();

        assertThat(invitationRepository.findAll().stream()
            .anyMatch(inv -> "resp@pilote-ci.fr".equals(inv.getEmail())
                && "responsable".equals(inv.getRole()))).isTrue();

        String schema = TenantProvisioningService.schemaName("pilote-ci");
        Integer count = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM information_schema.schemata WHERE schema_name = ?",
            Integer.class, schema
        );
        assertThat(count).isEqualTo(1);
    }

    @Test
    void creer_retourne409SlugDuplique() throws Exception {
        String body = """
            {"nom":"Copie","slug":"existante-ci","emailResponsable":"resp@test.com"}
            """;

        mockMvc.perform(post("/api/admin/associations")
                .cookie(new Cookie("access_token", tokenSuperAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isConflict());
    }

    @Test
    void creer_retourne400SlugInvalide() throws Exception {
        String body = """
            {"nom":"Test","slug":"SLUG INVALIDE!!","emailResponsable":"resp@test.com"}
            """;

        mockMvc.perform(post("/api/admin/associations")
                .cookie(new Cookie("access_token", tokenSuperAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isBadRequest());
    }

    @Test
    void creer_refuse403PourNonSuperAdmin() throws Exception {
        String body = """
            {"nom":"Test","slug":"test-refuse","emailResponsable":"resp@test.com"}
            """;

        mockMvc.perform(post("/api/admin/associations")
                .cookie(new Cookie("access_token", tokenNonAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isForbidden());
    }
}
