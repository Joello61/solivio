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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class ProfilBeneficiaireControllerIntegrationTest {

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
    private String tokenBeneficiaire;
    private String tokenBenevole;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        compte = new Compte("benef@example.com",
            passwordEncoder.encode("password123!"), "Dupont", "Alice");
        compte.setEmailVerifie(true);
        compteRepository.save(compte);

        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email, compte_email) "
                + "VALUES (?, 'Dupont', 'Alice', 'benef@example.com', 'benef@example.com')",
            UUID.randomUUID()
        );

        MembreAssociation membre = new MembreAssociation(compte, "beneficiaire");
        membreRepo.save(membre);

        tokenBeneficiaire = jwtService.genererAccessToken(
            compte.getId(), "benef@example.com", "Dupont", "Alice", List.of("beneficiaire"), null, false
        );
        tokenBenevole = jwtService.genererAccessToken(
            UUID.randomUUID(), "autre@example.com", "Autre", "User", List.of("benevole"), null, false
        );
    }

    @AfterEach
    void tearDown() {
        membreRepo.deleteAll();
        compteRepository.delete(compte);
    }

    @Test
    void lireProfil_retourneProfilVideInitialement() throws Exception {
        mockMvc.perform(get("/api/me/profil-beneficiaire")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.complet").value(false))
            .andExpect(jsonPath("$.statutBoursier").doesNotExist());
    }

    @Test
    void mettreAJour_creeEtRetourneProfil() throws Exception {
        mockMvc.perform(put("/api/me/profil-beneficiaire")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statutBoursier\":\"boursier\","
                    + "\"echelonBourse\":3,"
                    + "\"categorieNationalite\":\"francaise\","
                    + "\"niveauAcademique\":\"L3\","
                    + "\"situationLogement\":\"colocation\","
                    + "\"etablissement\":\"Universite Paris\","
                    + "\"aEmploiEtudiant\":false,"
                    + "\"dateNaissance\":\"2000-01-15\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutBoursier").value("boursier"))
            .andExpect(jsonPath("$.echelonBourse").value(3))
            .andExpect(jsonPath("$.etablissement").value("Universite Paris"))
            .andExpect(jsonPath("$.complet").value(true));
    }

    @Test
    void mettreAJour_refuseStatutBoursierInvalide() throws Exception {
        mockMvc.perform(put("/api/me/profil-beneficiaire")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statutBoursier\":\"invalide\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void lireProfil_refuseUnBenevole() throws Exception {
        mockMvc.perform(get("/api/me/profil-beneficiaire")
                .cookie(new Cookie("access_token", tokenBenevole)))
            .andExpect(status().isForbidden());
    }

    @Test
    void dossier_lisibleParLeResponsableSeulEtTrace() throws Exception {
        mockMvc.perform(put("/api/me/profil-beneficiaire")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statutBoursier\":\"boursier\",\"echelonBourse\":4}"))
            .andExpect(status().isOk());
        String url = "/api/association/membres/" + compte.getId() + "/profil-beneficiaire";

        mockMvc.perform(get(url).cookie(new Cookie("access_token", jeton("responsable", false))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutBoursier").value("boursier"))
            .andExpect(jsonPath("$.echelonBourse").value(4));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM journal_audit "
            + "WHERE action = 'PROFIL_BENEFICIAIRE_CONSULTE' AND entite_id = ?", Integer.class, compte.getId()))
            .isEqualTo(1);

        mockMvc.perform(get(url).cookie(new Cookie("access_token", jeton("coordinateur", false))))
            .andExpect(status().isForbidden());
        mockMvc.perform(get(url).cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
        mockMvc.perform(get(url).cookie(new Cookie("access_token", jeton(null, true))))
            .andExpect(status().isForbidden());
    }

    @Test
    void dossier_introuvablePourUnCompteQuiNEstPasBeneficiaire() throws Exception {
        membreRepo.findByCompteId(compte.getId()).ifPresent(m -> {
            m.setRole("benevole");
            membreRepo.save(m);
        });
        mockMvc.perform(get("/api/association/membres/" + compte.getId() + "/profil-beneficiaire")
                .cookie(new Cookie("access_token", jeton("responsable", false))))
            .andExpect(status().isNotFound());
    }

    private String jeton(String role, boolean superAdmin) {
        return jwtService.genererAccessToken(UUID.randomUUID(), "acteur@example.com", "Acteur", "Test",
            role == null ? List.of() : List.of(role), null, superAdmin);
    }

    @Test
    void lireProfil_retourne401SansToken() throws Exception {
        mockMvc.perform(get("/api/me/profil-beneficiaire"))
            .andExpect(status().isUnauthorized());
    }
}
