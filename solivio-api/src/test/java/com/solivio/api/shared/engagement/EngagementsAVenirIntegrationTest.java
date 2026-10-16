package com.solivio.api.shared.engagement;

import com.solivio.api.collecte.application.EngagementsCollecteAdapter;
import com.solivio.api.evenement.application.EngagementsEvenementAdapter;
import com.solivio.api.inscription.application.EngagementsInscriptionAdapter;
import com.solivio.api.reconditionnement.application.EngagementsReconditionnementAdapter;
import com.solivio.api.support.SolivioIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/** Ce qui engage encore une personne, module par module (ADR-012). */
@SolivioIntegrationTest
class EngagementsAVenirIntegrationTest {

    @Autowired private EngagementsInscriptionAdapter inscriptions;
    @Autowired private EngagementsEvenementAdapter evenements;
    @Autowired private EngagementsReconditionnementAdapter reconditionnement;
    @Autowired private EngagementsCollecteAdapter collecte;
    @Autowired private JdbcTemplate jdbcTemplate;

    private UUID personne;

    @BeforeEach
    void setUp() {
        personne = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO personne (id, nom, prenom, email) VALUES (?, 'Nom', 'Prenom', ?)",
            personne, personne + "@engagement.test");
    }

    @Test
    void sansRien_aucunEngagement() {
        assertThat(inscriptions.aDesEngagementsAVenir(personne)).isFalse();
        assertThat(evenements.aDesEngagementsAVenir(personne)).isFalse();
        assertThat(reconditionnement.aDesEngagementsAVenir(personne)).isFalse();
        assertThat(collecte.aDesEngagementsAVenir(personne)).isFalse();
    }

    @Test
    void inscription_engageTantQueLaDistributionNEstPasClose() {
        UUID publiee = distribution("PUBLIEE");
        UUID terminee = distribution("TERMINEE");
        inscription(terminee, "CONFIRMEE");
        assertThat(inscriptions.aDesEngagementsAVenir(personne)).isFalse();

        inscription(publiee, "LISTE_ATTENTE");
        assertThat(inscriptions.aDesEngagementsAVenir(personne)).isTrue();
    }

    @Test
    void inscriptionAnnulee_nEngagePas() {
        inscription(distribution("PUBLIEE"), "ANNULEE");

        assertThat(inscriptions.aDesEngagementsAVenir(personne)).isFalse();
    }

    @Test
    void participation_engageSiLEvenementEstPublie() {
        participation(evenement("TERMINE"));
        assertThat(evenements.aDesEngagementsAVenir(personne)).isFalse();

        participation(evenement("PUBLIE"));
        assertThat(evenements.aDesEngagementsAVenir(personne)).isTrue();
    }

    @Test
    void sessionDeReconditionnement_engageSiPublieeEtConfirmee() {
        inscriptionSession(session("PUBLIEE"), "ANNULEE");
        inscriptionSession(session("TERMINEE"), "CONFIRMEE");
        assertThat(reconditionnement.aDesEngagementsAVenir(personne)).isFalse();

        inscriptionSession(session("EN_COURS"), "CONFIRMEE");
        assertThat(reconditionnement.aDesEngagementsAVenir(personne)).isTrue();
    }

    @Test
    void missionPrise_engageJusquAuDepot() {
        mission("DEPOT_VALIDE");
        assertThat(collecte.aDesEngagementsAVenir(personne)).isFalse();

        mission("COLLECTE_EFFECTUEE");
        assertThat(collecte.aDesEngagementsAVenir(personne)).isTrue();
    }

    private UUID distribution(String statut) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO distribution (id, titre, date, statut, capacite_beneficiaires, "
            + "capacite_benevoles, mode_creneau, base_repartition, cree_par_id) "
            + "VALUES (?, 'Distribution', ?, ?, 10, 5, 'CRENEAU_UNIQUE', 'INSCRITS', ?)",
            id, LocalDate.now().plusDays(3), statut, personne);
        return id;
    }

    private void inscription(UUID distribution, String statut) {
        jdbcTemplate.update("INSERT INTO inscription (id, distribution_id, personne_id, nom, prenom, type, statut) "
            + "VALUES (?, ?, ?, 'Nom', 'Prenom', 'BENEFICIAIRE', ?)", UUID.randomUUID(), distribution, personne, statut);
    }

    private UUID evenement(String statut) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO evenement (id, titre, date_heure_debut, date_heure_fin, statut, cree_par_id) "
            + "VALUES (?, 'Fete', now(), now() + interval '2 hours', ?, ?)", id, statut, personne);
        return id;
    }

    private void participation(UUID evenement) {
        jdbcTemplate.update("INSERT INTO participation_evenement (evenement_id, personne_id) VALUES (?, ?)",
            evenement, personne);
    }

    private UUID session(String statut) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO session_reconditionnement (id, titre, date_heure_debut, date_heure_fin, "
            + "statut, cree_par_id) VALUES (?, 'Session', now(), now() + interval '2 hours', ?, ?)",
            id, statut, personne);
        return id;
    }

    private void inscriptionSession(UUID session, String statut) {
        jdbcTemplate.update("INSERT INTO inscription_reconditionnement (session_id, personne_id, statut) "
            + "VALUES (?, ?, ?)", session, personne, statut);
    }

    private void mission(String statut) {
        jdbcTemplate.update("INSERT INTO mission_collecte (titre, date_heure, statut, benevole_id, cree_par_id) "
            + "VALUES ('Collecte', now(), ?, ?, ?)", statut, personne, personne);
    }
}
