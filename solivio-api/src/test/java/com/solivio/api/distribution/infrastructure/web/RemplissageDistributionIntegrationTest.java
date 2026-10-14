package com.solivio.api.distribution.infrastructure.web;

import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Remplissage des distributions selon le role, et lecture publique des prochaines dates. */
@SolivioIntegrationTest
class RemplissageDistributionIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;

    private MockMvc mockMvc;
    private Cookie coordinateur;
    private Cookie beneficiaire;
    private UUID createur;
    private final LocalDate dans5Jours = LocalDate.now().plusDays(5);

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        coordinateur = new Cookie("access_token", jwtService.genererAccessToken(
            UUID.randomUUID(), "coord@test.com", "Coord", "Test", List.of("coordinateur"), null, false));
        beneficiaire = new Cookie("access_token", jwtService.genererAccessToken(
            UUID.randomUUID(), "benef@test.com", "Benef", "Test", List.of("beneficiaire"), null, false));
        createur = personne();
    }

    // 10 places beneficiaires, 4 benevoles ; creneau de 10:00 plein, 1 place a 11:00.
    private UUID distributionRemplie() {
        UUID id = distribution("PUBLIEE", dans5Jours, 10, "CRENEAUX_DECOUPES");
        UUID matin = creneau(id, "10:00", "11:00", 6);
        UUID suite = creneau(id, "11:00", "12:00", 6);
        for (int i = 0; i < 6; i++) {
            inscription(id, matin, "BENEFICIAIRE", "CONFIRMEE", null);
        }
        for (int i = 0; i < 3; i++) {
            inscription(id, suite, "BENEFICIAIRE", "CONFIRMEE", null);
        }
        inscription(id, matin, "BENEFICIAIRE", "LISTE_ATTENTE", 1);
        inscription(id, null, "BENEVOLE", "CONFIRMEE", null);
        inscription(id, null, "BENEVOLE", "LISTE_ATTENTE", 1);
        return id;
    }

    @Test
    void detail_gestionnaire_voitLesEffectifs() throws Exception {
        UUID id = distributionRemplie();

        mockMvc.perform(get("/api/distributions/" + id).cookie(coordinateur))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.remplissage.placesRestantesBeneficiaires").value(1))
            .andExpect(jsonPath("$.remplissage.placesRestantesBenevoles").value(3))
            .andExpect(jsonPath("$.remplissage.beneficiairesConfirmes").value(9))
            .andExpect(jsonPath("$.remplissage.beneficiairesEnAttente").value(1))
            .andExpect(jsonPath("$.remplissage.benevolesConfirmes").value(1))
            .andExpect(jsonPath("$.remplissage.benevolesEnAttente").value(1))
            .andExpect(jsonPath("$.creneaux[0].confirmes").value(6))
            .andExpect(jsonPath("$.creneaux[0].enAttente").value(1))
            .andExpect(jsonPath("$.creneaux[0].placesRestantes").value(0))
            .andExpect(jsonPath("$.creneaux[1].placesRestantes").value(1));
    }

    @Test
    void detail_beneficiaire_voitSeulementLesPlacesRestantes() throws Exception {
        UUID id = distributionRemplie();

        mockMvc.perform(get("/api/distributions/" + id).cookie(beneficiaire))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.remplissage.placesRestantesBeneficiaires").value(1))
            .andExpect(jsonPath("$.remplissage.beneficiairesConfirmes").doesNotExist())
            .andExpect(jsonPath("$.remplissage.beneficiairesEnAttente").doesNotExist())
            .andExpect(jsonPath("$.creneaux[0].placesRestantes").value(0))
            .andExpect(jsonPath("$.creneaux[0].confirmes").doesNotExist());
    }

    @Test
    void liste_porteLeRemplissageDeChaqueDistribution() throws Exception {
        distributionRemplie();
        UUID vide = distribution("PUBLIEE", dans5Jours.plusDays(1), 20, "CRENEAU_UNIQUE");
        creneau(vide, "14:00", "16:00", 20);

        mockMvc.perform(get("/api/distributions").cookie(beneficiaire))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].remplissage.placesRestantesBeneficiaires").value(1))
            .andExpect(jsonPath("$[1].remplissage.placesRestantesBeneficiaires").value(20))
            .andExpect(jsonPath("$[1].creneaux[0].placesRestantes").value(20));
        mockMvc.perform(get("/api/distributions").cookie(coordinateur))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.capaciteBeneficiaires == 10)].remplissage.beneficiairesConfirmes").value(9));
    }

    @Test
    void prochainesPubliques_accessiblesSansConnexionEtSansEffectifs() throws Exception {
        UUID pleine = distribution("PUBLIEE", dans5Jours, 2, "CRENEAU_UNIQUE");
        creneau(pleine, "17:30", "19:30", 2);
        inscription(pleine, null, "BENEFICIAIRE", "CONFIRMEE", null);
        inscription(pleine, null, "BENEFICIAIRE", "CONFIRMEE", null);
        distributionRemplie();
        distribution("BROUILLON", dans5Jours, 10, "CRENEAU_UNIQUE");
        distribution("ANNULEE", dans5Jours, 10, "CRENEAU_UNIQUE");
        distribution("TERMINEE", LocalDate.now().minusDays(3), 10, "CRENEAU_UNIQUE");

        mockMvc.perform(get("/api/public/distributions/prochaines"))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "max-age=300, public"))
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[?(@.heureDebut == '17:30:00')].complet").value(true))
            .andExpect(jsonPath("$[?(@.heureDebut == '10:00:00')].complet").value(false))
            .andExpect(jsonPath("$[?(@.heureDebut == '10:00:00')].heureFin").value("12:00:00"))
            .andExpect(jsonPath("$[?(@.heureDebut == '10:00:00')].lieuNom").value("Local Rangueil"))
            .andExpect(jsonPath("$[0].id").doesNotExist())
            .andExpect(jsonPath("$[0].remplissage").doesNotExist())
            .andExpect(jsonPath("$[0].titre").doesNotExist());
    }

    @Test
    void prochainesPubliques_limiteesASix() throws Exception {
        for (int i = 0; i < 8; i++) {
            distribution("PUBLIEE", dans5Jours.plusDays(i), 10, "CRENEAU_UNIQUE");
        }

        mockMvc.perform(get("/api/public/distributions/prochaines"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(6)))
            .andExpect(jsonPath("$[0].date").value(dans5Jours.toString()));
    }

    private UUID personne() {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Nom', 'Prenom', ?)",
            id, id + "@test.com");
        return id;
    }

    private UUID distribution(String statut, LocalDate date, int capacite, String mode) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, "
            + "capacite_benevoles, mode_creneau, base_repartition, cree_par_id, lieu_nom, lieu_adresse_formatee) "
            + "VALUES (?, 'Distribution', ?, ?, ?, 4, ?, 'INSCRITS', ?, 'Local Rangueil', '135 avenue de Rangueil')",
            id, date, statut, capacite, mode, createur);
        return id;
    }

    private UUID creneau(UUID distribution, String debut, String fin, int capacite) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO creneau (id, distribution_id, heure_debut, heure_fin, capacite) "
            + "VALUES (?, ?, ?::time, ?::time, ?)", id, distribution, debut, fin, capacite);
        return id;
    }

    private void inscription(UUID distribution, UUID creneau, String type, String statut, Integer rang) {
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, creneau_id, personne_id, nom, prenom, type, "
            + "statut, rang_liste_attente) VALUES (?, ?, ?, ?, 'Nom', 'Prenom', ?, ?, ?)",
            UUID.randomUUID(), distribution, creneau, personne(), type, statut, rang);
    }
}
