package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.web.dto.GoogleCompleteRegistrationRequest;
import com.solivio.api.identity.infrastructure.web.dto.LoginRequest;
import com.solivio.api.identity.infrastructure.web.dto.RegisterRequest;
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

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import jakarta.servlet.http.Cookie;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class AuthControllerIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private CompteRepository compteRepository;

    @Autowired
    private AssociationRepository associationRepository;

    @Autowired
    private MembreAssociationRepository membreRepo;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final tools.jackson.databind.json.JsonMapper jsonMapper =
        tools.jackson.databind.json.JsonMapper.builder().build();

    private Association association;
    private Compte compte;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
            .apply(springSecurity())
            .build();

        compte = new Compte("alice@example.com", passwordEncoder.encode("password123!"), "Dupont", "Alice");
        compte.setEmailVerifie(true);
        compteRepository.save(compte);

        MembreAssociation membre = new MembreAssociation(compte, "beneficiaire");
        membreRepo.save(membre);
    }

    @AfterEach
    void tearDown() {
        membreRepo.deleteAll();
        compteRepository.deleteAll();
    }

    @Test
    void login_retourne200AvecTokenEtCookiePourIdentifiantsValides() throws Exception {
        LoginRequest request = new LoginRequest("alice@example.com", "password123!", false);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(cookie().exists("access_token"))
            .andExpect(cookie().httpOnly("access_token", true));
    }

    @Test
    void login_retourne401PourMauvaisMotDePasse() throws Exception {
        LoginRequest request = new LoginRequest("alice@example.com", "wrongpassword", false);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void login_retourne401PourEmailInconnu() throws Exception {
        LoginRequest request = new LoginRequest("unknown@example.com", "password123!", false);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void register_retourne201PourNouvelInscription() throws Exception {
        RegisterRequest request = new RegisterRequest(
            "bob@example.com", "password123!", "Martin", "Bob", null);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().isCreated());

        assertThat(compteRepository.existsByEmail("bob@example.com")).isTrue();
    }

    @Test
    void register_retourne4xxPourEmailDejaPris() throws Exception {
        RegisterRequest request = new RegisterRequest(
            "alice@example.com", "password123!", "Autre", "Personne", null);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
            .andExpect(status().is4xxClientError());
    }

    @Test
    void me_retourne401SansToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void me_retourne200AvecBearerHeader() throws Exception {
        LoginRequest loginReq = new LoginRequest("alice@example.com", "password123!", false);
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String accessToken = jsonMapper.readTree(loginResponse).get("accessToken").asText();

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("alice@example.com"))
            .andExpect(jsonPath("$.nom").value("Dupont"));
    }

    @Test
    void me_retourne200AvecAccessTokenCookie() throws Exception {
        // Verifie le flux BFF : le cookie access_token pose par /login suffit pour /me.
        LoginRequest loginReq = new LoginRequest("alice@example.com", "password123!", false);
        Cookie accessTokenCookie = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn().getResponse().getCookie("access_token");

        assertThat(accessTokenCookie).isNotNull();

        mockMvc.perform(get("/api/auth/me")
                .cookie(accessTokenCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("alice@example.com"));
    }

    @Test
    void refresh_retourne200ViaCookieEtRetourneNouveauToken() throws Exception {
        LoginRequest loginReq = new LoginRequest("alice@example.com", "password123!", false);
        Cookie refreshCookie = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andReturn().getResponse().getCookie("refresh_token");

        assertThat(refreshCookie).isNotNull();

        // Flux web BFF : pas de body, pas de Content-Type, cookie envoye automatiquement
        mockMvc.perform(post("/api/auth/refresh")
                .cookie(refreshCookie))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andExpect(cookie().exists("access_token"))
            .andExpect(cookie().exists("refresh_token"));
    }

    @Test
    void refresh_retourne200ViaBodyJsonPourMobile() throws Exception {
        // Login pour obtenir le refreshToken depuis le corps de reponse (flux mobile)
        LoginRequest loginReq = new LoginRequest("alice@example.com", "password123!", false);
        String loginBody = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(loginReq)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andReturn().getResponse().getContentAsString();

        String refreshToken = jsonMapper.readTree(loginBody).get("refreshToken").asText();

        // Refresh via body JSON (flux mobile) : pas de cookie
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    void refresh_retourne400SansCookieNiBody() throws Exception {
        mockMvc.perform(post("/api/auth/refresh"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void googleCompleteRegistration_retourne200PourCompteGoogleSansAffiliation() throws Exception {
        Compte googleCompte = new Compte("google@example.com", null, "Dupont", "Alice");
        googleCompte.setGoogleId("google-uid-123");
        compteRepository.save(googleCompte);

        GoogleCompleteRegistrationRequest body = new GoogleCompleteRegistrationRequest(
            "google@example.com", "Dupont", "Alice", null);

        mockMvc.perform(post("/api/auth/google/complete-registration")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(body)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(cookie().exists("access_token"));
    }

    @Test
    void googleCompleteRegistration_retourne400SiPasGoogleId() throws Exception {
        // alice@example.com n'a pas de google_id (compte email/mot de passe)
        GoogleCompleteRegistrationRequest body = new GoogleCompleteRegistrationRequest(
            "alice@example.com", "Dupont", "Alice", null);

        mockMvc.perform(post("/api/auth/google/complete-registration")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void googleCompleteRegistration_retourne400SiDejaAffilie() throws Exception {
        Compte googleCompteAffilie = new Compte("google2@example.com", null, "Martin", "Bob");
        googleCompteAffilie.setGoogleId("google-uid-789");
        compteRepository.save(googleCompteAffilie);
        membreRepo.save(new MembreAssociation(googleCompteAffilie, "beneficiaire"));

        GoogleCompleteRegistrationRequest body = new GoogleCompleteRegistrationRequest(
            "google2@example.com", "Martin", "Bob", null);

        mockMvc.perform(post("/api/auth/google/complete-registration")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void googleLinkMobileInit_retourne302VersOAuth2() throws Exception {
        mockMvc.perform(get("/api/auth/google/link-mobile-init"))
            .andExpect(status().is3xxRedirection());
    }
}
