package com.solivio.api.notification.infrastructure.web;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class EmailLibreControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String tokenAdmin;
    private String tokenBenevole;

    private static final String TENANT = "email-libre-test";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        UUID personneAdminId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) VALUES (?, ?, ?, ?)",
            personneAdminId, "Admin", "Test", "admin@el.com");

        tokenAdmin = jwtService.genererAccessToken(
            UUID.randomUUID(), "admin@el.com", "Admin", "Test", List.of("admin"), null, false
        );
        tokenBenevole = jwtService.genererAccessToken(
            UUID.randomUUID(), "ben@el.com", "Ben", "Test", List.of("benevole"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        try {
        } catch (Exception ignored) {}
    }

    @Test
    void envoyerEmailLibre_retourne200AvecAdmin() throws Exception {
        mockMvc.perform(post("/api/notifications/email-libre")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "cible": "BENEVOLES",
                      "sujet": "Information importante",
                      "corps": "Bonjour a tous, ceci est un message test."
                    }
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void envoyerEmailLibre_refuseBenevole() throws Exception {
        mockMvc.perform(post("/api/notifications/email-libre")
                .cookie(new Cookie("access_token", tokenBenevole))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "cible": "BENEVOLES",
                      "sujet": "Test",
                      "corps": "Corps"
                    }
                    """))
            .andExpect(status().isForbidden());
    }

    @Test
    void envoyerEmailLibre_retourne400SiSujetManquant() throws Exception {
        mockMvc.perform(post("/api/notifications/email-libre")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "cible": "BENEVOLES",
                      "corps": "Corps sans sujet"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void envoyerEmailLibre_retourne400SiCibleManquante() throws Exception {
        mockMvc.perform(post("/api/notifications/email-libre")
                .cookie(new Cookie("access_token", tokenAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "sujet": "Test sans cible",
                      "corps": "Corps"
                    }
                    """))
            .andExpect(status().isBadRequest());
    }
}
