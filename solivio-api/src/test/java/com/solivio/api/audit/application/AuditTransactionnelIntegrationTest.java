package com.solivio.api.audit.application;

import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.support.SolivioIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * I10 : la trace d'audit est ecrite dans la transaction de l'action, depuis le
 * service, au nom du compte authentifie.
 */
@SolivioIntegrationTest
class AuditTransactionnelIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private JwtService jwtService;
    @Autowired private AuditService auditService;
    @Autowired private TransactionTemplate transactionTemplate;

    private MockMvc mockMvc;
    private final UUID compteId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void actionReussie_traceeAuNomDuCompteAuthentifie() throws Exception {
        UUID distributionId = insererDistribution("BROUILLON");

        mockMvc.perform(post("/api/distributions/" + distributionId + "/publier").cookie(jeton("coordinateur")))
            .andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForList(
            "SELECT acteur_id FROM journal_audit WHERE action = 'DISTRIBUTION_PUBLIEE' AND entite_id = ?",
            UUID.class, distributionId)).containsExactly(compteId);
    }

    @Test
    void actionRefusee_nestPasTracee() throws Exception {
        UUID distributionId = insererDistribution("TERMINEE");

        mockMvc.perform(post("/api/distributions/" + distributionId + "/publier").cookie(jeton("coordinateur")))
            .andExpect(status().is4xxClientError());

        assertThat(compterTraces(distributionId)).isZero();
    }

    @Test
    void rollbackDeLaTransaction_emporteLaTrace() {
        UUID entite = UUID.randomUUID();

        transactionTemplate.executeWithoutResult(statut -> {
            auditService.tracer("TEST", "test", entite);
            statut.setRollbackOnly();
        });

        assertThat(compterTraces(entite)).isZero();
    }

    @Test
    void export_estTrace() throws Exception {
        mockMvc.perform(get("/api/association/export").cookie(jeton("responsable")))
            .andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject(
            "SELECT count(*) FROM journal_audit WHERE action = 'EXPORT_DONNEES' AND acteur_id = ?",
            Integer.class, compteId)).isEqualTo(1);
    }

    @Test
    void tracer_exigeLaTransactionDeLAction() {
        assertThatThrownBy(() -> auditService.tracer("TEST", "test", UUID.randomUUID()))
            .isInstanceOf(IllegalTransactionStateException.class);
    }

    private Cookie jeton(String role) {
        return new Cookie("access_token", jwtService.genererAccessToken(
            compteId, "acteur@audit.test", "Nom", "Prenom", List.of(role), null, false));
    }

    private UUID insererDistribution(String statut) {
        UUID createur = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'C', 'T', ?)",
            createur, createur + "@audit.test");
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, "
            + "mode_creneau, base_repartition, cree_par_id) VALUES (?, 'D', CURRENT_DATE + 3, ?, 10, "
            + "'CRENEAU_UNIQUE', 'INSCRITS', ?)", id, statut, createur);
        return id;
    }

    private int compterTraces(UUID entiteId) {
        return jdbcTemplate.queryForObject(
            "SELECT count(*) FROM journal_audit WHERE entite_id = ?", Integer.class, entiteId);
    }
}
