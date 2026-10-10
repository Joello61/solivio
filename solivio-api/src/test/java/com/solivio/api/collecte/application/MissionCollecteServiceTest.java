package com.solivio.api.collecte.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.collecte.domain.MissionCollecte;
import com.solivio.api.collecte.domain.StatutMission;
import com.solivio.api.collecte.infrastructure.evenements.CollecteEventPublisher;
import com.solivio.api.collecte.infrastructure.persistence.MissionCollecteRepository;
import com.solivio.api.collecte.infrastructure.web.dto.AnnulerMissionRequest;
import com.solivio.api.collecte.infrastructure.web.dto.CreateMissionCollecteRequest;
import com.solivio.api.collecte.infrastructure.web.dto.MissionCollecteResponse;
import com.solivio.api.collecte.infrastructure.web.dto.UpdateMissionCollecteRequest;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MissionCollecteServiceTest {

    @Mock private MissionCollecteRepository missionRepository;
    @Mock private CollecteEventPublisher eventPublisher;
    @Mock private PersonneQueryPort personneQueryPort;
    @Mock private AuditService auditService;

    private MissionCollecteService service;
    private UUID missionId;
    private UUID creeParId;
    private UUID benevoleId;
    private MissionCollecte mission;

    @BeforeEach
    void setUp() {
        service = new MissionCollecteService(missionRepository, eventPublisher, personneQueryPort, auditService);
        missionId = UUID.randomUUID();
        creeParId = UUID.randomUUID();
        benevoleId = UUID.randomUUID();
        mission = new MissionCollecte(
            "Collecte test", null,
            null, "12 rue de la Paix, Paris", 48.8698, 2.3311,
            null, "Entrepot central, Paris", 48.8502, 2.3488,
            ZonedDateTime.now().plusDays(3), 6, creeParId
        );
        mission.setId(missionId);
    }

    @Test
    void creer_sauvegardeLaMissionEtEmetUnEvenement() {
        when(personneQueryPort.trouverPersonne("admin@example.com"))
            .thenReturn(new PersonneInfo(creeParId, "Admin", "Test"));
        when(missionRepository.save(any(MissionCollecte.class))).thenAnswer(inv -> {
            MissionCollecte m = inv.getArgument(0);
            m.setId(missionId);
            return m;
        });

        CreateMissionCollecteRequest request = new CreateMissionCollecteRequest(
            "Collecte test", null, null, null,
            ZonedDateTime.now().plusDays(3), 6
        );
        MissionCollecteResponse response = service.creer(request, "admin@example.com");

        assertThat(response.titre()).isEqualTo("Collecte test");
        assertThat(response.statut()).isEqualTo("DISPONIBLE");
        verify(missionRepository).save(any(MissionCollecte.class));
        verify(eventPublisher).publierCreee(any(), any());
    }

    @Test
    void prendre_assigneLaMission() {
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("ben@example.com"))
            .thenReturn(new PersonneInfo(benevoleId, "Ben", "Evole"));
        when(missionRepository.countByBenevoleIdAndStatutIn(eq(benevoleId), any()))
            .thenReturn(0L);
        when(personneQueryPort.trouverPersonneParId(benevoleId))
            .thenReturn(new PersonneContactInfo(benevoleId, "ben@example.com", "Ben", "Evole"));
        when(missionRepository.save(any(MissionCollecte.class))).thenAnswer(inv -> inv.getArgument(0));

        MissionCollecteResponse response = service.prendre(missionId, "ben@example.com");

        assertThat(response.statut()).isEqualTo("PRISE_EN_CHARGE");
        assertThat(response.benevoleId()).isEqualTo(benevoleId);
    }

    @Test
    void prendre_echoueSiMissionNonDisponible() {
        mission.prendreEnCharge(UUID.randomUUID());
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> service.prendre(missionId, "ben@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("plus disponible");
    }

    @Test
    void prendre_echoueSiBenevoleADejaUneMissionActive() {
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("ben@example.com"))
            .thenReturn(new PersonneInfo(benevoleId, "Ben", "Evole"));
        when(missionRepository.countByBenevoleIdAndStatutIn(eq(benevoleId), any()))
            .thenReturn(1L);

        assertThatThrownBy(() -> service.prendre(missionId, "ben@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("mission en cours");
    }

    @Test
    void liberer_retourneADisponible() {
        mission.prendreEnCharge(benevoleId);
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("ben@example.com"))
            .thenReturn(new PersonneInfo(benevoleId, "Ben", "Evole"));
        when(missionRepository.save(any(MissionCollecte.class))).thenAnswer(inv -> inv.getArgument(0));

        MissionCollecteResponse response = service.liberer(missionId, "ben@example.com");

        assertThat(response.statut()).isEqualTo("DISPONIBLE");
        assertThat(response.benevoleId()).isNull();
    }

    @Test
    void liberer_echoueSiBenevoleNonAssigne() {
        UUID autreBenevoleId = UUID.randomUUID();
        mission.prendreEnCharge(autreBenevoleId);
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("ben@example.com"))
            .thenReturn(new PersonneInfo(benevoleId, "Ben", "Evole"));

        assertThatThrownBy(() -> service.liberer(missionId, "ben@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("n'etes pas le benevole assigne");
    }

    @Test
    void validerCollecte_transitionneDePriseEnChargeVersCollecteEffectuee() {
        mission.prendreEnCharge(benevoleId);
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(missionRepository.save(any(MissionCollecte.class))).thenAnswer(inv -> inv.getArgument(0));
        when(personneQueryPort.trouverPersonneParId(benevoleId))
            .thenReturn(new PersonneContactInfo(benevoleId, "ben@example.com", "Ben", "Evole"));

        MissionCollecteResponse response = service.validerCollecte(missionId);

        assertThat(response.statut()).isEqualTo("COLLECTE_EFFECTUEE");
        assertThat(response.dateCollecteEffectuee()).isNotNull();
    }

    @Test
    void validerDepot_transitionneVersDepotValide() {
        mission.prendreEnCharge(benevoleId);
        mission.validerCollecte();
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("ben@example.com"))
            .thenReturn(new PersonneInfo(benevoleId, "Ben", "Evole"));
        when(personneQueryPort.trouverPersonneParId(benevoleId))
            .thenReturn(new PersonneContactInfo(benevoleId, "ben@example.com", "Ben", "Evole"));
        when(missionRepository.save(any(MissionCollecte.class))).thenAnswer(inv -> inv.getArgument(0));

        MissionCollecteResponse response = service.validerDepot(missionId, "ben@example.com");

        assertThat(response.statut()).isEqualTo("DEPOT_VALIDE");
        assertThat(response.dateDepotValide()).isNotNull();
    }

    @Test
    void validerDepot_echoueSiPasBenevoleAssigne() {
        UUID autreBenevoleId = UUID.randomUUID();
        mission.prendreEnCharge(autreBenevoleId);
        mission.validerCollecte();
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("ben@example.com"))
            .thenReturn(new PersonneInfo(benevoleId, "Ben", "Evole"));

        assertThatThrownBy(() -> service.validerDepot(missionId, "ben@example.com"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("benevole assigne");
    }

    @Test
    void annuler_passeMissionAnnulee() {
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("admin@example.com"))
            .thenReturn(new PersonneInfo(creeParId, "Admin", "Test"));
        when(missionRepository.save(any(MissionCollecte.class))).thenAnswer(inv -> inv.getArgument(0));

        MissionCollecteResponse response = service.annuler(
            missionId, new AnnulerMissionRequest("Raison test"),
            "admin@example.com", true
        );

        assertThat(response.statut()).isEqualTo("ANNULEE");
        assertThat(response.raisonAnnulation()).isEqualTo("Raison test");
        verify(eventPublisher).publierAnnulee(any(), any(), any());
    }

    // I3 : un benevole n'annule que la mission qui lui est assignee.
    @Test
    void annuler_parUnBenevoleNonAssigne_estIntrouvable() {
        mission.prendreEnCharge(benevoleId);
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("autre@example.com"))
            .thenReturn(new PersonneInfo(UUID.randomUUID(), "Autre", "Benevole"));

        assertThatThrownBy(() -> service.annuler(
            missionId, new AnnulerMissionRequest("Raison"), "autre@example.com", false))
            .isInstanceOf(NotFoundException.class);
        verify(missionRepository, never()).save(any());
    }

    @Test
    void annuler_parLeBenevoleAssigne_passeMissionAnnulee() {
        mission.prendreEnCharge(benevoleId);
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("ben@example.com"))
            .thenReturn(new PersonneInfo(benevoleId, "Ben", "Evole"));
        when(missionRepository.save(any(MissionCollecte.class))).thenAnswer(inv -> inv.getArgument(0));

        MissionCollecteResponse response = service.annuler(
            missionId, new AnnulerMissionRequest("Empechement"), "ben@example.com", false);

        assertThat(response.statut()).isEqualTo("ANNULEE");
    }

    @Test
    void detail_parUnAutreBenevole_masqueLeNomDuBenevoleAssigne() {
        mission.prendreEnCharge(benevoleId);
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("autre@example.com"))
            .thenReturn(new PersonneInfo(UUID.randomUUID(), "Autre", "Benevole"));

        MissionCollecteResponse response = service.detail(missionId, "autre@example.com", false);

        assertThat(response.benevoleNomComplet()).isNull();
        verify(personneQueryPort, never()).trouverPersonneParId(benevoleId);
    }

    @Test
    void detail_parLeBenevoleAssigne_afficheSonNom() {
        mission.prendreEnCharge(benevoleId);
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("ben@example.com"))
            .thenReturn(new PersonneInfo(benevoleId, "Ben", "Evole"));
        when(personneQueryPort.trouverPersonneParId(benevoleId))
            .thenReturn(new PersonneContactInfo(benevoleId, "ben@example.com", "Ben", "Evole"));

        MissionCollecteResponse response = service.detail(missionId, "ben@example.com", false);

        assertThat(response.benevoleNomComplet()).isNotNull();
    }

    @Test
    void modifier_echoueSiMissionNonDisponible() {
        mission.prendreEnCharge(benevoleId);
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));

        assertThatThrownBy(() -> service.modifier(missionId,
            new UpdateMissionCollecteRequest("Nouveau titre", null, null, null, null, null)))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("Modification impossible");
    }

    @Test
    void detail_retourneLaMission() {
        when(missionRepository.findById(missionId)).thenReturn(Optional.of(mission));
        when(personneQueryPort.trouverPersonne("admin@example.com"))
            .thenReturn(new PersonneInfo(creeParId, "Admin", "Test"));

        MissionCollecteResponse response = service.detail(missionId, "admin@example.com", true);

        assertThat(response.id()).isEqualTo(missionId);
        assertThat(response.titre()).isEqualTo("Collecte test");
    }

    @Test
    void detail_echoueSiMissionInexistante() {
        when(missionRepository.findById(missionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.detail(missionId, "admin@example.com", true))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void statutMission_transitionsValides() {
        assertThat(StatutMission.DISPONIBLE.peutTransitionnerVers(StatutMission.PRISE_EN_CHARGE)).isTrue();
        assertThat(StatutMission.DISPONIBLE.peutTransitionnerVers(StatutMission.ANNULEE)).isTrue();
        assertThat(StatutMission.DISPONIBLE.peutTransitionnerVers(StatutMission.COLLECTE_EFFECTUEE)).isFalse();
        assertThat(StatutMission.PRISE_EN_CHARGE.peutTransitionnerVers(StatutMission.DISPONIBLE)).isTrue();
        assertThat(StatutMission.PRISE_EN_CHARGE.peutTransitionnerVers(StatutMission.COLLECTE_EFFECTUEE)).isTrue();
        assertThat(StatutMission.PRISE_EN_CHARGE.peutTransitionnerVers(StatutMission.ANNULEE)).isTrue();
        assertThat(StatutMission.COLLECTE_EFFECTUEE.peutTransitionnerVers(StatutMission.DEPOT_VALIDE)).isTrue();
        assertThat(StatutMission.COLLECTE_EFFECTUEE.peutTransitionnerVers(StatutMission.ANNULEE)).isTrue();
        assertThat(StatutMission.DEPOT_VALIDE.peutTransitionnerVers(StatutMission.ANNULEE)).isFalse();
        assertThat(StatutMission.ANNULEE.peutTransitionnerVers(StatutMission.DISPONIBLE)).isFalse();
    }
}
