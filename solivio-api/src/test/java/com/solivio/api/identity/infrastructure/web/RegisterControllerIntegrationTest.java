package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.VerificationCode;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.VerificationCodeRepository;
import com.solivio.api.identity.infrastructure.web.dto.VerifyEmailRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class RegisterControllerIntegrationTest {

    private MockMvc mockMvc;

    @Autowired private WebApplicationContext webApplicationContext;
    @Autowired private CompteRepository compteRepository;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private MembreAssociationRepository membreRepo;
    @Autowired private VerificationCodeRepository verificationCodeRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private PasswordEncoder passwordEncoder;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();
    private Association association;
    private Compte compteNonVerifie;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
            .apply(springSecurity()).build();

        compteNonVerifie = new Compte("unverified@example.com",
            passwordEncoder.encode("password123!"), "Unverif", "User");
        compteNonVerifie.setEmailVerifie(false);
        compteRepository.save(compteNonVerifie);

        MembreAssociation membre = new MembreAssociation(compteNonVerifie, "beneficiaire");
        membreRepo.save(membre);
    }

    @AfterEach
    void tearDown() {
        verificationCodeRepository.deleteAll();
        membreRepo.deleteAll();
        compteRepository.deleteAll();
    }

    @Test
    void verifyEmail_retourne204AvecCodeValide() throws Exception {
        VerificationCode vc = new VerificationCode(
            compteNonVerifie, "123456", VerificationCode.TYPE_EMAIL,
            Instant.now().plusSeconds(900));
        verificationCodeRepository.save(vc);

        VerifyEmailRequest request = new VerifyEmailRequest("unverified@example.com", "123456");

        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());

        assertThat(compteRepository.findByEmail("unverified@example.com")
            .map(Compte::isEmailVerifie).orElse(false)).isTrue();
    }

    @Test
    void verifyEmail_retourne400AvecCodeInvalide() throws Exception {
        VerifyEmailRequest request = new VerifyEmailRequest("unverified@example.com", "000000");

        mockMvc.perform(post("/api/auth/verify-email")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void resendVerification_retourne204() throws Exception {
        VerifyEmailRequest request = new VerifyEmailRequest("unverified@example.com", "000000");

        mockMvc.perform(post("/api/auth/resend-verification")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());
    }
}
