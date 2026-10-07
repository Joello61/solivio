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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class AdminCompteControllerIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private CompteRepository compteRepository;
    @Autowired private AssociationRepository associationRepository;
    @Autowired private MembreAssociationRepository membreRepo;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;
    @Autowired private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
    private Association association;
    private Compte compteAdmin;
    private Compte compteCible;
    private String tokenSuperAdmin;
    private String tokenResponsable;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        compteAdmin = new Compte("admin@example.com",
            passwordEncoder.encode("password123!"), "Admin", "Super");
        compteAdmin.setEmailVerifie(true);
        compteAdmin.setSuperAdmin(true);
        compteRepository.save(compteAdmin);

        compteCible = new Compte("cible@example.com",
            passwordEncoder.encode("password123!"), "Cible", "User");
        compteCible.setEmailVerifie(true);
        compteRepository.save(compteCible);

        membreRepo.save(new MembreAssociation(compteAdmin, "responsable"));
        membreRepo.save(new MembreAssociation(compteCible, "benevole"));

        tokenSuperAdmin = jwtService.genererAccessToken(
            compteAdmin.getId(), "admin@example.com", "Admin", "Super", List.of("responsable"), null, true
        );
        tokenResponsable = jwtService.genererAccessToken(
            UUID.randomUUID(), "resp@example.com", "Resp", "User", List.of("responsable"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        membreRepo.deleteAll();
        compteRepository.delete(compteAdmin);
        // compteCible peut avoir ete supprime dans un test.
        if (compteRepository.existsById(compteCible.getId())) {
            compteRepository.delete(compteCible);
        }
    }

    @Test
    void lister_retourneListeDesComptes() throws Exception {
        mockMvc.perform(get("/api/admin/comptes")
                .cookie(new Cookie("access_token", tokenSuperAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void lister_refuseUnSimpleResponsable() throws Exception {
        mockMvc.perform(get("/api/admin/comptes")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isForbidden());
    }

    @Test
    void lireParId_retourneLeCompte() throws Exception {
        mockMvc.perform(get("/api/admin/comptes/" + compteCible.getId())
                .cookie(new Cookie("access_token", tokenSuperAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("cible@example.com"))
            .andExpect(jsonPath("$.actif").value(true));
    }

    @Test
    void mettreAJourStatut_desactiveLeCompte() throws Exception {
        mockMvc.perform(patch("/api/admin/comptes/" + compteCible.getId() + "/statut")
                .cookie(new Cookie("access_token", tokenSuperAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"actif\":false}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.actif").value(false));

        assertThat(compteRepository.findById(compteCible.getId()).get().isActif()).isFalse();
    }

    @Test
    void mettreAJourSuperAdmin_basculeLeFlag() throws Exception {
        mockMvc.perform(patch("/api/admin/comptes/" + compteCible.getId() + "/super-admin")
                .cookie(new Cookie("access_token", tokenSuperAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"superAdmin\":true}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.superAdmin").value(true));
    }

    @Test
    void supprimer_supprimeLeScompte() throws Exception {
        mockMvc.perform(delete("/api/admin/comptes/" + compteCible.getId())
                .cookie(new Cookie("access_token", tokenSuperAdmin)))
            .andExpect(status().isNoContent());

        assertThat(compteRepository.existsById(compteCible.getId())).isFalse();
    }

    @Test
    void supprimer_retourne404PourCompteInconnu() throws Exception {
        mockMvc.perform(delete("/api/admin/comptes/" + UUID.randomUUID())
                .cookie(new Cookie("access_token", tokenSuperAdmin)))
            .andExpect(status().isNotFound());
    }

    @Test
    void lister_avecRecherche_filtreParNom() throws Exception {
        mockMvc.perform(get("/api/admin/comptes")
                .param("q", "cible")
                .cookie(new Cookie("access_token", tokenSuperAdmin)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].email").value("cible@example.com"));
    }
}
