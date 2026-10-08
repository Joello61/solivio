package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifie que la limite de debit est bien branchee dans la chaine de securite.
 */
@SolivioIntegrationTest
@TestPropertySource(properties = "solivio.securite.limite-debit-auth.requetes-par-minute=2")
class LimiteDebitAuthIntegrationTest {

    @Autowired private WebApplicationContext context;

    @Test
    void troisiemeTentativeDansLaMinute_repond429() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        String corps = "{\"email\":\"personne@example.com\",\"motDePasse\":\"faux-mdp\",\"rememberMe\":false}";

        for (int i = 0; i < 2; i++) {
            mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(corps))
                .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(corps))
            .andExpect(status().isTooManyRequests())
            .andExpect(header().string("Retry-After", "60"));
    }
}
