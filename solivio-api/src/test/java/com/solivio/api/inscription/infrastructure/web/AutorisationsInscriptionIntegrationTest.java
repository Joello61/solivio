package com.solivio.api.inscription.infrastructure.web;

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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Autorisations de l'inscription et du pointage sur de vraies donnees :
 * desinscription par le seul proprietaire (C1), role requis selon le type
 * d'inscription (C2), pointage reserve aux gestionnaires (ADR-012).
 */
@SolivioIntegrationTest
class AutorisationsInscriptionIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private UUID distributionId;
    private UUID marieId;
    private UUID benevoleId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        marieId = insererPersonne("marie@test.com");
        insererPersonne("paul@test.com");
        insererPersonne("coord@test.com");
        benevoleId = insererPersonne("ben@test.com");
        distributionId = insererDistribution("PUBLIEE");
    }

    // --- C1 ---

    @Test
    void desinscrire_parUneAutrePersonne_repond404EtNeModifieRien() throws Exception {
        UUID inscription = insererInscription(distributionId, marieId, "BENEFICIAIRE");

        mockMvc.perform(delete(urlInscription(distributionId, inscription))
                .cookie(jeton("paul@test.com", "beneficiaire")))
            .andExpect(status().isNotFound());

        assertThat(statut(inscription)).isEqualTo("CONFIRMEE");
    }

    @Test
    void desinscrire_parUnCoordinateur_repond404() throws Exception {
        UUID inscription = insererInscription(distributionId, marieId, "BENEFICIAIRE");

        mockMvc.perform(delete(urlInscription(distributionId, inscription))
                .cookie(jeton("coord@test.com", "coordinateur")))
            .andExpect(status().isNotFound());

        assertThat(statut(inscription)).isEqualTo("CONFIRMEE");
    }

    @Test
    void desinscrire_avecUneAutreDistributionDansLeChemin_repond404() throws Exception {
        UUID inscription = insererInscription(distributionId, marieId, "BENEFICIAIRE");
        UUID autreDistribution = insererDistribution("PUBLIEE");

        mockMvc.perform(delete(urlInscription(autreDistribution, inscription))
                .cookie(jeton("marie@test.com", "beneficiaire")))
            .andExpect(status().isNotFound());
    }

    @Test
    void desinscrire_parLeProprietaire_repond204() throws Exception {
        UUID inscription = insererInscription(distributionId, marieId, "BENEFICIAIRE");

        mockMvc.perform(delete(urlInscription(distributionId, inscription))
                .cookie(jeton("marie@test.com", "beneficiaire")))
            .andExpect(status().isNoContent());

        assertThat(statut(inscription)).isEqualTo("ANNULEE");
    }

    // --- C2 ---

    @Test
    void inscrire_beneficiaireEnTantQueBenevole_repond403() throws Exception {
        inscrire(jeton("marie@test.com", "beneficiaire"), "BENEVOLE")
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void inscrire_benevoleEnTantQueBeneficiaire_repond403() throws Exception {
        inscrire(jeton("ben@test.com", "benevole"), "BENEFICIAIRE")
            .andExpect(status().isForbidden());
    }

    @Test
    void inscrire_membreSuspenduSansRole_repond403() throws Exception {
        inscrire(jeton("marie@test.com"), "BENEFICIAIRE")
            .andExpect(status().isForbidden());
    }

    // ADR-012 : un coordinateur ne s'inscrit comme benevole que s'il l'est aussi.
    @Test
    void inscrire_coordinateurSeulEnTantQueBenevole_repond403() throws Exception {
        inscrire(jeton("coord@test.com", "coordinateur"), "BENEVOLE")
            .andExpect(status().isForbidden());
    }

    @Test
    void inscrire_coordinateurBenevoleEnTantQueBenevole_repond201() throws Exception {
        inscrire(jeton("coord@test.com", "benevole", "coordinateur"), "BENEVOLE")
            .andExpect(status().isCreated());
    }

    @Test
    void inscrire_responsableEnTantQueBenevole_repond403() throws Exception {
        inscrire(jeton("coord@test.com", "responsable"), "BENEVOLE")
            .andExpect(status().isForbidden());
    }

    // Benevole et beneficiaire : une place de chaque cote a la meme distribution.
    @Test
    void inscrire_benevoleEtBeneficiaire_peutTenirLesDeuxPlaces() throws Exception {
        Cookie mixte = jeton("marie@test.com", "benevole", "beneficiaire");

        inscrire(mixte, "BENEFICIAIRE").andExpect(status().isCreated());
        inscrire(mixte, "BENEVOLE").andExpect(status().isCreated());
    }

    @Test
    void inscrire_beneficiaireEnTantQueBeneficiaire_repond201() throws Exception {
        inscrire(jeton("marie@test.com", "beneficiaire"), "BENEFICIAIRE")
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("CONFIRMEE"));
    }

    // --- Pointage reserve aux coordinateurs et responsables (ADR-012) ---

    @Test
    void pointage_benevoleMemeInscrit_repond403EnLectureEtEnEcriture() throws Exception {
        UUID distributionEnCours = insererDistribution("EN_COURS");
        UUID inscription = insererInscription(distributionEnCours, marieId, "BENEFICIAIRE");
        insererInscription(distributionEnCours, benevoleId, "BENEVOLE");
        Cookie benevole = jeton("ben@test.com", "benevole");

        mockMvc.perform(get("/api/distributions/" + distributionEnCours + "/pointage").cookie(benevole))
            .andExpect(status().isForbidden());
        pointer(distributionEnCours, inscription, benevole)
            .andExpect(status().isForbidden());
        assertThat(presence(inscription)).isEqualTo("NON_POINTE");
    }

    @Test
    void pointage_coordinateurEtResponsable_repondent200() throws Exception {
        UUID distributionEnCours = insererDistribution("EN_COURS");
        UUID inscription = insererInscription(distributionEnCours, marieId, "BENEFICIAIRE");

        mockMvc.perform(get("/api/distributions/" + distributionEnCours + "/pointage")
                .param("q", "Test").cookie(jeton("resp@test.com", "responsable")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
        pointer(distributionEnCours, inscription, jeton("coord@test.com", "coordinateur"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.presence").value("PRESENT"));
    }

    @Test
    void pointage_inscriptionDUneAutreDistribution_repond404PourUnCoordinateur() throws Exception {
        UUID distributionEnCours = insererDistribution("EN_COURS");
        UUID autreDistribution = insererDistribution("EN_COURS");
        UUID inscription = insererInscription(autreDistribution, marieId, "BENEFICIAIRE");

        pointer(distributionEnCours, inscription, jeton("coord@test.com", "coordinateur"))
            .andExpect(status().isNotFound());
        assertThat(presence(inscription)).isEqualTo("NON_POINTE");
    }

    // --- Outils ---

    private ResultActions inscrire(Cookie cookie, String type) throws Exception {
        return mockMvc.perform(post("/api/distributions/" + distributionId + "/inscriptions")
            .cookie(cookie)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"type\":\"" + type + "\"}"));
    }

    private ResultActions pointer(UUID distribution, UUID inscription, Cookie cookie) throws Exception {
        return mockMvc.perform(put("/api/distributions/" + distribution + "/pointage/" + inscription)
            .cookie(cookie)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"presence\":\"PRESENT\"}"));
    }

    private Cookie jeton(String email, String... roles) {
        return new Cookie("access_token", jwtService.genererAccessToken(
            UUID.randomUUID(), email, "Test", "Test", List.of(roles), null, false));
    }

    private static String urlInscription(UUID distribution, UUID inscription) {
        return "/api/distributions/" + distribution + "/inscriptions/" + inscription;
    }

    private UUID insererPersonne(String email) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Test', 'Test', ?)", id, email);
        return id;
    }

    private UUID insererDistribution(String statut) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, capacite_benevoles, "
                + "mode_creneau, base_repartition, cree_par_id) VALUES (?, 'Distribution', ?, ?, 10, 5, "
                + "'CRENEAU_UNIQUE', 'INSCRITS', ?)",
            id, LocalDate.now(), statut, marieId);
        return id;
    }

    private UUID insererInscription(UUID distribution, UUID personne, String type) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type) "
                + "VALUES (?, ?, ?, 'Test', 'Test', ?)",
            id, distribution, personne, type);
        return id;
    }

    private String statut(UUID inscription) {
        return jdbcTemplate.queryForObject("SELECT statut FROM inscription WHERE id = ?", String.class, inscription);
    }

    private String presence(UUID inscription) {
        return jdbcTemplate.queryForObject("SELECT presence FROM inscription WHERE id = ?", String.class,
            inscription);
    }
}
