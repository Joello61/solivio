package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.inscription.application.InscriptionService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * I9 : droit a l'effacement. Compte et profil supprimes, personne et copies du nom
 * anonymisees, historique et compteurs conserves.
 */
@SolivioIntegrationTest
class EffacementIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;
    @Autowired private InscriptionService inscriptionService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void effacerMesDonnees_supprimeCompteEtProfilEtAnonymiseLaPersonne() throws Exception {
        UUID compteId = creerMembre("marie@effacement.test", "beneficiaire");
        UUID personneId = personneDe("marie@effacement.test");
        jdbcTemplate.update("INSERT INTO profil_beneficiaire (personne_id, statut_boursier) VALUES (?, 'boursier')",
            personneId);
        UUID distributionId = creerDistribution(personneId);
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type, statut) "
            + "VALUES (?, ?, ?, 'Dupont', 'Marie', 'BENEFICIAIRE', 'CONFIRMEE')",
            UUID.randomUUID(), distributionId, personneId);

        mockMvc.perform(delete("/api/me").cookie(jeton(compteId, "marie@effacement.test", "beneficiaire")))
            .andExpect(status().isNoContent())
            .andExpect(header().stringValues("Set-Cookie", hasItem(startsWith("access_token=;"))));

        assertThat(compter("SELECT count(*) FROM compte WHERE id = ?", compteId)).isZero();
        assertThat(compter("SELECT count(*) FROM profil_beneficiaire WHERE personne_id = ?", personneId)).isZero();
        Map<String, Object> personne = jdbcTemplate.queryForMap(
            "SELECT nom, prenom, email, telephone, compte_email, date_suppression FROM personne WHERE id = ?",
            personneId);
        assertThat(personne.get("nom")).isEqualTo("Personne");
        assertThat((String) personne.get("email")).startsWith("efface-").doesNotContain("marie");
        assertThat(personne.get("compte_email")).isNull();
        assertThat(personne.get("date_suppression")).isNotNull();
        // L'inscription reste (compteurs), son nom est anonymise par l'ecouteur du module inscription.
        await().atMost(15, TimeUnit.SECONDS).until(() -> "Personne".equals(jdbcTemplate.queryForObject(
            "SELECT nom FROM inscription WHERE personne_id = ?", String.class, personneId)));
        assertThat(compter("SELECT count(*) FROM inscription WHERE personne_id = ? AND statut = 'CONFIRMEE'",
            personneId)).isEqualTo(1);

        // Ecouteur rejoue (livraison au moins une fois) : meme resultat.
        inscriptionService.anonymiserPersonne(personneId);
        assertThat(jdbcTemplate.queryForObject("SELECT prenom FROM inscription WHERE personne_id = ?",
            String.class, personneId)).isEqualTo("supprimée");
    }

    @Test
    void effacerMesDonnees_refuseLeDernierSuperAdmin() throws Exception {
        UUID compteId = creerMembre("root2@effacement.test", "benevole");
        jdbcTemplate.update("UPDATE compte SET is_super_admin = true WHERE id = ?", compteId);

        mockMvc.perform(delete("/api/me").cookie(jeton(compteId, "root2@effacement.test", "benevole")))
            .andExpect(status().isConflict());
    }

    @Test
    void effacerMesDonnees_refuseLeDernierResponsable() throws Exception {
        UUID compteId = creerMembre("resp@effacement.test", "responsable");

        mockMvc.perform(delete("/api/me").cookie(jeton(compteId, "resp@effacement.test", "responsable")))
            .andExpect(status().isConflict());

        assertThat(compter("SELECT count(*) FROM compte WHERE id = ?", compteId)).isEqualTo(1);
    }

    @Test
    void effacementParSuperAdmin_reserveAuSuperAdmin() throws Exception {
        UUID cible = creerMembre("paul@effacement.test", "benevole");
        UUID responsable = creerMembre("resp2@effacement.test", "responsable");

        mockMvc.perform(post("/api/admin/comptes/" + cible + "/effacement")
                .cookie(jeton(responsable, "resp2@effacement.test", "responsable")))
            .andExpect(status().isForbidden());

        String superAdmin = jwtService.genererAccessToken(
            UUID.randomUUID(), "root@effacement.test", "Root", "Admin", List.of(), null, true);
        mockMvc.perform(post("/api/admin/comptes/" + cible + "/effacement")
                .cookie(new Cookie("access_token", superAdmin)))
            .andExpect(status().isNoContent());
        assertThat(compter("SELECT count(*) FROM compte WHERE id = ?", cible)).isZero();
    }

    private UUID creerMembre(String email, String role) {
        UUID compteId = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO compte (id, email, password_hash, nom, prenom, email_verifie) "
            + "VALUES (?, ?, 'hash', 'Dupont', 'Marie', true)", compteId, email);
        UUID membreId = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO membre (id, compte_id) VALUES (?, ?)", membreId, compteId);
        jdbcTemplate.update("INSERT INTO membre_role (membre_id, role) VALUES (?, ?)", membreId, role);
        jdbcTemplate.update("INSERT INTO personne (id, compte_email, nom, prenom, email, telephone) "
            + "VALUES (?, ?, 'Dupont', 'Marie', ?, '0600000000')", UUID.randomUUID(), email, email);
        return compteId;
    }

    private UUID personneDe(String email) {
        return jdbcTemplate.queryForObject("SELECT id FROM personne WHERE email = ?", UUID.class, email);
    }

    private UUID creerDistribution(UUID createur) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, "
            + "mode_creneau, base_repartition, cree_par_id) VALUES (?, 'Distribution', CURRENT_DATE + 3, "
            + "'PUBLIEE', 10, 'CRENEAU_UNIQUE', 'INSCRITS', ?)", id, createur);
        return id;
    }

    private Cookie jeton(UUID compteId, String email, String role) {
        return new Cookie("access_token",
            jwtService.genererAccessToken(compteId, email, "Dupont", "Marie", List.of(role), null, false));
    }

    private int compter(String sql, UUID id) {
        return jdbcTemplate.queryForObject(sql, Integer.class, id);
    }
}
