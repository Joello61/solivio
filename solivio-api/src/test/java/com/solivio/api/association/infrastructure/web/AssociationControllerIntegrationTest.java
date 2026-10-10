package com.solivio.api.association.infrastructure.web;

import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
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
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private String tokenResponsable;
    private String tokenBeneficiaire;
    private UUID compteResponsableId;
    private UUID compteCoordinateurId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        compteResponsableId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO compte (id, email, password_hash, nom, prenom, email_verifie) "
                + "VALUES (?, ?, 'hash', 'Resp', 'Config', true)",
            compteResponsableId, "resp@cfg.com"
        );
        jdbcTemplate.update(
            "INSERT INTO membre (compte_id, role) VALUES (?, 'responsable')",
            compteResponsableId
        );

        compteCoordinateurId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO compte (id, email, password_hash, nom, prenom, email_verifie) "
                + "VALUES (?, ?, 'hash', 'Coord', 'Config', true)",
            compteCoordinateurId, "coord@cfg.com"
        );
        jdbcTemplate.update("INSERT INTO membre (compte_id, role) VALUES (?, 'coordinateur')", compteCoordinateurId);

        tokenResponsable = jwtService.genererAccessToken(
            compteResponsableId, "resp@cfg.com", "Resp", "Config", List.of("responsable"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@cfg.com", "Benef", "Test", List.of("beneficiaire"), null, false
        );
    }

    @Test
    void lireAssociation_retourneConfigComplete() throws Exception {
        mockMvc.perform(get("/api/association")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.slug").doesNotExist())
            .andExpect(jsonPath("$.nom").value("Linkee Toulouse"))
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
            .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void changerStatutMembre_suspenduEtReactive() throws Exception {
        // Suspension
        mockMvc.perform(patch("/api/association/membres/" + compteCoordinateurId + "/statut")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statut\":\"suspendu\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("suspendu"));

        // Reactivation
        mockMvc.perform(patch("/api/association/membres/" + compteCoordinateurId + "/statut")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statut\":\"actif\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("actif"));
    }

    @Test
    void changerStatutMembre_refuseStatutInvalide() throws Exception {
        mockMvc.perform(patch("/api/association/membres/" + compteCoordinateurId + "/statut")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statut\":\"inconnu\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void supprimerMembre_desactiveLeCompte() throws Exception {
        mockMvc.perform(delete("/api/association/membres/" + compteCoordinateurId)
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isNoContent());
    }

    // I2 : un responsable ne peut ni se suspendre ni se retirer lui-meme.
    @Test
    void changerSonPropreStatut_retourne409() throws Exception {
        mockMvc.perform(patch("/api/association/membres/" + compteResponsableId + "/statut")
                .cookie(new Cookie("access_token", tokenResponsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"statut\":\"suspendu\"}"))
            .andExpect(status().isConflict());
    }

    @Test
    void retirerLeDernierResponsable_parUnSuperAdmin_retourne409() throws Exception {
        String tokenSuperAdmin = jwtService.genererAccessToken(
            UUID.randomUUID(), "root@cfg.com", "Root", "Admin", List.of(), null, true);

        mockMvc.perform(delete("/api/association/membres/" + compteResponsableId)
                .cookie(new Cookie("access_token", tokenSuperAdmin)))
            .andExpect(status().isConflict());
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

    @Test
    void exporterAssociation_exclutLesTablesDAuthentification() throws Exception {
        byte[] zip = mockMvc.perform(get("/api/association/export")
                .cookie(new Cookie("access_token", tokenResponsable)))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsByteArray();

        java.util.Set<String> entrees = new java.util.HashSet<>();
        try (java.util.zip.ZipInputStream in = new java.util.zip.ZipInputStream(new java.io.ByteArrayInputStream(zip))) {
            for (java.util.zip.ZipEntry e = in.getNextEntry(); e != null; e = in.getNextEntry()) {
                entrees.add(e.getName());
            }
        }
        org.assertj.core.api.Assertions.assertThat(entrees)
            .contains("association.json", "membre.json", "personne.json", "distribution.json")
            .doesNotContain("compte.json", "refresh_token.json", "verification_code.json", "invitation.json");
    }
}
