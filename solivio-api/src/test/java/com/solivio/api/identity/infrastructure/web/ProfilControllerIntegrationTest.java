package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class ProfilControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private CompteRepository compteRepository;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private MembreAssociationRepository membreRepo;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private Association association;
    private Compte compte;
    private String token;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        compte = new Compte("profil@example.com",
            passwordEncoder.encode("password123!"), "Dupont", "Alice");
        compte.setEmailVerifie(true);
        compteRepository.save(compte);

        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email, compte_email) "
                + "VALUES (?, 'Dupont', 'Alice', 'profil@example.com', 'profil@example.com')",
            UUID.randomUUID()
        );

        MembreAssociation membre = new MembreAssociation(compte, "benevole");
        membreRepo.save(membre);

        token = jwtService.genererAccessToken(
            compte.getId(), "profil@example.com", "Dupont", "Alice", List.of("benevole"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        membreRepo.deleteAll();
        compteRepository.delete(compte);
    }

    @Test
    void mettreAJourProfil_modifieNomEtTelephone() throws Exception {
        mockMvc.perform(patch("/api/me")
                .cookie(new Cookie("access_token", token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"Martin\",\"prenom\":\"Alice\",\"telephone\":\"0600000001\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nom").value("Martin"))
            .andExpect(jsonPath("$.telephone").value("0600000001"));
    }

    @Test
    void mettreAJourProfil_champsVides_retourneBadRequest() throws Exception {
        mockMvc.perform(patch("/api/me")
                .cookie(new Cookie("access_token", token))
                .contentType(MediaType.APPLICATION_JSON)
                // nom depasse 100 caracteres
                .content("{\"nom\":\"" + "A".repeat(101) + "\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void uploadPhoto_retourne200AvecProfilMisAJour() throws Exception {
        // JPEG minimal valide (1x1 pixel) pour satisfaire la validation du type MIME.
        byte[] jpeg = new byte[]{
            (byte)0xFF, (byte)0xD8, (byte)0xFF, (byte)0xE0,
            0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
            (byte)0xFF, (byte)0xD9
        };
        MockMultipartFile photo = new MockMultipartFile(
            "file", "avatar.jpg", "image/jpeg", jpeg);

        mockMvc.perform(multipart("/api/me/photo")
                .file(photo)
                .cookie(new Cookie("access_token", token)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("profil@example.com"));
    }

    @Test
    void mettreAJourProfil_sansCookieRetourne401() throws Exception {
        mockMvc.perform(patch("/api/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"Hack\"}"))
            .andExpect(status().isUnauthorized());
    }
}
