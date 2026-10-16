package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ADR-012 : le responsable fixe les roles d'un membre, chacun s'ajoute seul le role
 * benevole ou beneficiaire, et un responsable n'a que ce role.
 */
@SolivioIntegrationTest
class RolesMembreIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private UUID responsable;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        responsable = insererMembre("resp@roles.test", "responsable");
        insererMembre("resp2@roles.test", "responsable");
    }

    @Test
    void responsable_attribueEtRetireDesRoles() throws Exception {
        UUID lea = insererMembre("lea@roles.test", "benevole");

        changerRoles(lea, jeton(responsable, "resp@roles.test", "responsable"),
                "[\"benevole\", \"beneficiaire\", \"coordinateur\"]")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles.length()").value(3));
        assertThat(roles(lea)).isEqualTo("beneficiaire,benevole,coordinateur");

        changerRoles(lea, jeton(responsable, "resp@roles.test", "responsable"), "[\"beneficiaire\"]")
            .andExpect(status().isOk());
        assertThat(roles(lea)).isEqualTo("beneficiaire");
    }

    @Test
    void coordinateur_nePeutPasChangerLesRoles() throws Exception {
        UUID lea = insererMembre("lea@roles.test", "benevole");

        changerRoles(lea, jeton(UUID.randomUUID(), "coord@roles.test", "coordinateur"), "[\"coordinateur\"]")
            .andExpect(status().isForbidden());
        assertThat(roles(lea)).isEqualTo("benevole");
    }

    @Test
    void responsableAvecUnAutreRole_estRefuse() throws Exception {
        UUID lea = insererMembre("lea@roles.test", "benevole");

        changerRoles(lea, jeton(responsable, "resp@roles.test", "responsable"), "[\"responsable\", \"benevole\"]")
            .andExpect(status().isConflict());
        assertThat(roles(lea)).isEqualTo("benevole");
    }

    // Une mission prise est un engagement a venir : la promotion attend qu'elle soit deposee.
    @Test
    void promotionResponsable_refuseeAvecUnEngagementAVenir() throws Exception {
        UUID lea = insererMembre("lea@roles.test", "benevole");
        UUID personne = jdbcTemplate.queryForObject(
            "SELECT id FROM personne WHERE email = 'lea@roles.test'", UUID.class);
        jdbcTemplate.update("INSERT INTO mission_collecte (titre, date_heure, statut, benevole_id, cree_par_id) "
            + "VALUES ('Collecte', now() + interval '2 days', 'PRISE_EN_CHARGE', ?, ?)", personne, personne);

        changerRoles(lea, jeton(responsable, "resp@roles.test", "responsable"), "[\"responsable\"]")
            .andExpect(status().isConflict());
        assertThat(roles(lea)).isEqualTo("benevole");
    }

    @Test
    void promotionResponsable_sansEngagement_retireLesAutresRoles() throws Exception {
        UUID lea = insererMembre("lea@roles.test", "benevole", "beneficiaire");

        changerRoles(lea, jeton(responsable, "resp@roles.test", "responsable"), "[\"responsable\"]")
            .andExpect(status().isOk());
        assertThat(roles(lea)).isEqualTo("responsable");
    }

    @Test
    void benevole_sAjouteLeRoleBeneficiaireAvecLAttestation() throws Exception {
        UUID lea = insererMembre("lea@roles.test", "benevole");

        ajouterMonRole(jeton(lea, "lea@roles.test", "benevole"), "beneficiaire", true)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles.length()").value(2));
        assertThat(roles(lea)).isEqualTo("beneficiaire,benevole");
    }

    @Test
    void beneficiaire_sansAttestation_estRefuse() throws Exception {
        UUID lea = insererMembre("lea@roles.test", "benevole");

        ajouterMonRole(jeton(lea, "lea@roles.test", "benevole"), "beneficiaire", false)
            .andExpect(status().isBadRequest());
        assertThat(roles(lea)).isEqualTo("benevole");
    }

    @Test
    void personneNeSAjouteUnRoleDeGestion() throws Exception {
        UUID lea = insererMembre("lea@roles.test", "beneficiaire");

        ajouterMonRole(jeton(lea, "lea@roles.test", "beneficiaire"), "coordinateur", false)
            .andExpect(status().isBadRequest());
        assertThat(roles(lea)).isEqualTo("beneficiaire");
    }

    @Test
    void responsable_neSAjoutePasDeRole() throws Exception {
        ajouterMonRole(jeton(responsable, "resp@roles.test", "responsable"), "benevole", false)
            .andExpect(status().isConflict());
        assertThat(roles(responsable)).isEqualTo("responsable");
    }

    @Test
    void ajouterMonRole_exigeUneSession() throws Exception {
        mockMvc.perform(post("/api/me/roles")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\": \"benevole\"}"))
            .andExpect(status().isUnauthorized());
    }

    private ResultActions changerRoles(UUID compteId, Cookie cookie, String roles) throws Exception {
        return mockMvc.perform(put("/api/association/membres/" + compteId + "/roles")
            .cookie(cookie)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"roles\": " + roles + "}"));
    }

    private ResultActions ajouterMonRole(Cookie cookie, String role, boolean attestation) throws Exception {
        return mockMvc.perform(post("/api/me/roles")
            .cookie(cookie)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"role\": \"" + role + "\", \"attestationEtudiant\": " + attestation + "}"));
    }

    private UUID insererMembre(String email, String... roles) {
        UUID compteId = UUID.randomUUID();
        UUID membreId = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO compte (id, email, password_hash, nom, prenom, email_verifie) "
            + "VALUES (?, ?, 'hash', 'Nom', 'Prenom', true)", compteId, email);
        jdbcTemplate.update("INSERT INTO membre (id, compte_id) VALUES (?, ?)", membreId, compteId);
        for (String role : roles) {
            jdbcTemplate.update("INSERT INTO membre_role (membre_id, role) VALUES (?, ?)", membreId, role);
        }
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email, compte_email) "
            + "VALUES (?, 'Nom', 'Prenom', ?, ?)", UUID.randomUUID(), email, email);
        return compteId;
    }

    private String roles(UUID compteId) {
        return jdbcTemplate.queryForObject("SELECT string_agg(r.role, ',' ORDER BY r.role) FROM membre m"
            + " JOIN membre_role r ON r.membre_id = m.id WHERE m.compte_id = ?", String.class, compteId);
    }

    private Cookie jeton(UUID compteId, String email, String role) {
        return new Cookie("access_token",
            jwtService.genererAccessToken(compteId, email, "Nom", "Prenom", List.of(role), null, false));
    }
}
