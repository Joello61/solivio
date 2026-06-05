package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.association.multitenancy.TenantFlywayMigrator;
import com.solivio.api.association.multitenancy.TenantProvisioningService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.VerificationCodeRepository;
import com.solivio.api.identity.infrastructure.web.dto.ForgotPasswordRequest;
import com.solivio.api.identity.infrastructure.web.dto.ResetPasswordRequest;
import com.solivio.api.support.SolivioIntegrationTest;
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
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class PasswordControllerIntegrationTest {

    private MockMvc mockMvc;

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private CompteRepository compteRepository;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private MembreAssociationRepository membreRepo;
    @Autowired private VerificationCodeRepository verificationCodeRepository;
    @Autowired private TenantFlywayMigrator flywayMigrator;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private PasswordEncoder passwordEncoder;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private Association association;
    private Compte compte;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
            .apply(springSecurity()).build();

        association = new Association("pwd-test", "Password Test Asso");
        association.setCode("PWDTEST");
        associationRepository.save(association);

        String schema = TenantProvisioningService.schemaName("pwd-test");
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"" + schema + "\"");
        flywayMigrator.migrate(schema);

        compte = new Compte("alice@example.com", passwordEncoder.encode("password123!"), "Dupont", "Alice");
        compte.setEmailVerifie(true);
        compteRepository.save(compte);

        MembreAssociation membre = new MembreAssociation(compte, association, "beneficiaire");
        membreRepo.save(membre);
    }

    @AfterEach
    void tearDown() {
        verificationCodeRepository.deleteAll();
        membreRepo.deleteAll();
        compteRepository.deleteAll();
        String schema = TenantProvisioningService.schemaName("pwd-test");
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS \"" + schema + "\" CASCADE");
        associationRepository.delete(association);
    }

    @Test
    void forgotPassword_retourne204MemeEmailInconnu() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("unknown@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());
    }

    @Test
    void forgotPassword_retourne204EmailConnu() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("alice@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());
    }

    @Test
    void resetPassword_retourne204AvecCodeValide() throws Exception {
        // Cree un code de verification
        VerificationCode vc = new VerificationCode(
            compte, "654321", VerificationCode.TYPE_PASSWORD_RESET,
            Instant.now().plusSeconds(900));
        verificationCodeRepository.save(vc);

        ResetPasswordRequest request = new ResetPasswordRequest(
            "alice@example.com", "654321", "newPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());
    }

    @Test
    void resetPassword_retourne400AvecCodeInvalide() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest(
            "alice@example.com", "000000", "newPassword123!");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }
}
