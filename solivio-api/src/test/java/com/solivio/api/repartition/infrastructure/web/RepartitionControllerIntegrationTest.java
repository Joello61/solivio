package com.solivio.api.repartition.infrastructure.web;

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

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SolivioIntegrationTest
class RepartitionControllerIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AssociationRepository associationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtService jwtService;

    private MockMvc mockMvc;
    private Association association;
    private String tokenCoordinateur;
    private String tokenBeneficiaire;
    private UUID coordId;

    // Une date fixe finirait dans le passe, refusee a la creation.
    private static final String DANS_UNE_SEMAINE = java.time.LocalDate.now().plusDays(7).toString();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        // Le DistributionService appelle personneQueryPort.trouverPersonne(email)
        // lors de la creation. La personne doit donc exister.
        coordId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO personne (id, nom, prenom, email) "
                + "VALUES (?, 'Coord', 'Test', 'coord@test.com')",
            coordId
        );

        tokenCoordinateur = jwtService.genererAccessToken(
            coordId, "coord@test.com", "Coord", "Test", List.of("coordinateur"), null, false
        );
        tokenBeneficiaire = jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@test.com", "Benef", "Test", List.of("beneficiaire"), null, false
        );
    }

    @AfterEach
    void tearDown() {
    }

    // --- Securite ---

    @Test
    void saisirDenree_necessiteAuthentification() throws Exception {
        mockMvc.perform(post("/api/distributions/00000000-0000-0000-0000-000000000000/denrees")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Pommes\",\"unite\":\"KILOGRAMME\",\"nombreContenants\":1,\"quantiteParContenant\":10}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void saisirDenree_interditAuxBeneficiaires() throws Exception {
        mockMvc.perform(post("/api/distributions/00000000-0000-0000-0000-000000000000/denrees")
                .cookie(new Cookie("access_token", tokenBeneficiaire))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Pommes\",\"unite\":\"KILOGRAMME\",\"nombreContenants\":1,\"quantiteParContenant\":10}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void calculerDotation_necessiteRoleCoordinateur() throws Exception {
        mockMvc.perform(get("/api/distributions/00000000-0000-0000-0000-000000000000/repartition")
                .cookie(new Cookie("access_token", tokenBeneficiaire)))
            .andExpect(status().isForbidden());
    }

    // --- Fonctionnel ---

    @Test
    void saisirDenree_retourne404SiDistributionInexistante() throws Exception {
        mockMvc.perform(post("/api/distributions/00000000-0000-0000-0000-000000000000/denrees")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Pommes\",\"unite\":\"KILOGRAMME\",\"nombreContenants\":2,\"quantiteParContenant\":25.0}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void saisirDenree_retourne400SiDonneesInvalides() throws Exception {
        mockMvc.perform(post("/api/distributions/00000000-0000-0000-0000-000000000000/denrees")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"\",\"unite\":\"KILOGRAMME\",\"nombreContenants\":0,\"quantiteParContenant\":0}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void saisirPuisListerDenrees_retourneListeAvecDenreeSaisie() throws Exception {
        UUID distributionId = creerDistribution();

        mockMvc.perform(post("/api/distributions/" + distributionId + "/denrees")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Pommes de terre\",\"unite\":\"KILOGRAMME\","
                    + "\"nombreContenants\":2,\"quantiteParContenant\":25.0}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.libelle").value("Pommes de terre"))
            .andExpect(jsonPath("$.unite").value("KILOGRAMME"))
            .andExpect(jsonPath("$.quantiteTotale").value(50.0));

        mockMvc.perform(get("/api/distributions/" + distributionId + "/denrees")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$.length()").value(1));
    }

    // I8 : le libelle est nettoye avant persistance, et borne en longueur.
    @Test
    void saisirDenree_nettoieLeLibelleEtRefuseUnLibelleTropLong() throws Exception {
        UUID distributionId = creerDistribution();

        mockMvc.perform(post("/api/distributions/" + distributionId + "/denrees")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"<script>alert(1)</script>Riz\",\"unite\":\"KILOGRAMME\","
                    + "\"nombreContenants\":1,\"quantiteParContenant\":5.0}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.libelle").value("Riz"));

        mockMvc.perform(post("/api/distributions/" + distributionId + "/denrees")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"" + "x".repeat(201) + "\",\"unite\":\"KILOGRAMME\","
                    + "\"nombreContenants\":1,\"quantiteParContenant\":5.0}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void modifierDenree_metsAJourLesChamps() throws Exception {
        UUID distributionId = creerDistribution();
        String denreeId = creerDenree(distributionId, "Carottes", "KILOGRAMME", 1, 10.0);

        mockMvc.perform(put("/api/distributions/" + distributionId + "/denrees/" + denreeId)
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"libelle\":\"Carottes bio\",\"unite\":\"KILOGRAMME\","
                    + "\"nombreContenants\":3,\"quantiteParContenant\":15.0}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.libelle").value("Carottes bio"))
            .andExpect(jsonPath("$.quantiteTotale").value(45.0));
    }

    @Test
    void supprimerDenree_retourne204() throws Exception {
        UUID distributionId = creerDistribution();
        String denreeId = creerDenree(distributionId, "Poires", "PIECE", 5, 6.0);

        mockMvc.perform(delete("/api/distributions/" + distributionId + "/denrees/" + denreeId)
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/distributions/" + distributionId + "/denrees")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void calculerDotation_retourneReponseAvecNbBeneficiaires() throws Exception {
        UUID distributionId = creerDistribution();
        creerDenree(distributionId, "Yaourts", "PIECE", 6, 10.0);

        mockMvc.perform(get("/api/distributions/" + distributionId + "/repartition")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.distributionId").value(distributionId.toString()))
            .andExpect(jsonPath("$.base").isString())
            .andExpect(jsonPath("$.nbBeneficiaires").isNumber())
            .andExpect(jsonPath("$.denrees").isArray())
            .andExpect(jsonPath("$.denrees.length()").value(1))
            .andExpect(jsonPath("$.denrees[0].quantiteTotale").value(60.0));
    }

    @Test
    void calculerDotation_basculeVersPresentsAvecParamRequete() throws Exception {
        UUID distributionId = creerDistribution();

        mockMvc.perform(get("/api/distributions/" + distributionId + "/repartition")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .param("base", "PRESENTS"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.base").value("PRESENTS"));
    }

    @Test
    void calculerDotation_distributionInexistante_retourne404() throws Exception {
        mockMvc.perform(get("/api/distributions/00000000-0000-0000-0000-000000000000/repartition")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isNotFound());
    }

    // --- helpers ---

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private UUID creerDistribution() throws Exception {
        String body = mockMvc.perform(post("/api/distributions")
                .cookie(new Cookie("access_token", tokenCoordinateur))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"titre\":\"Dist Test\",\"date\":\"" + DANS_UNE_SEMAINE + "\","
                    + "\"capaciteBeneficiaires\":30,\"modeCreneau\":\"CRENEAU_UNIQUE\","
                    + "\"creneaux\":[{\"heureDebut\":\"17:00\",\"heureFin\":\"18:00\","
                    + "\"capacite\":30}]}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(JSON.readTree(body).get("id").asText());

        mockMvc.perform(post("/api/distributions/" + id + "/publier")
                .cookie(new Cookie("access_token", tokenCoordinateur)))
            .andExpect(status().isOk());
        return id;
    }

    private String creerDenree(UUID distributionId, String libelle, String unite,
                                int contenants, double qte) throws Exception {
        String body = mockMvc.perform(
                post("/api/distributions/" + distributionId + "/denrees")
                    .cookie(new Cookie("access_token", tokenCoordinateur))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"libelle\":\"" + libelle + "\",\"unite\":\"" + unite + "\","
                        + "\"nombreContenants\":" + contenants + ","
                        + "\"quantiteParContenant\":" + qte + "}"))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        return JSON.readTree(body).get("id").asText();
    }
}
