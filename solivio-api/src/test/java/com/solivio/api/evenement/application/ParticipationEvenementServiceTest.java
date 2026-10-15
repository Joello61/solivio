package com.solivio.api.evenement.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.evenement.domain.Evenement;
import com.solivio.api.evenement.domain.ModeInscription;
import com.solivio.api.evenement.domain.ParticipationEvenement;
import com.solivio.api.evenement.domain.PublicCible;
import com.solivio.api.evenement.domain.RoleParticipation;
import com.solivio.api.evenement.domain.StatutEvenement;
import com.solivio.api.evenement.domain.TypeEvenement;
import com.solivio.api.evenement.infrastructure.persistence.EvenementRepository;
import com.solivio.api.evenement.infrastructure.persistence.ParticipationEvenementRepository;
import com.solivio.api.evenement.infrastructure.web.dto.ParticipationEvenementResponse;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParticipationEvenementServiceTest {

    @Mock private EvenementRepository evenementRepository;
    @Mock private ParticipationEvenementRepository participationRepository;
    @Mock private PersonneQueryPort personneQueryPort;
    @Mock private AuditService auditService;

    private ParticipationEvenementService service;
    private UUID evenementId;
    private UUID personneId;
    private Evenement evenementPublie;

    @BeforeEach
    void setUp() {
        service = new ParticipationEvenementService(
            evenementRepository, participationRepository, personneQueryPort, auditService);
        evenementId = UUID.randomUUID();
        personneId = UUID.randomUUID();

        evenementPublie = new Evenement(
            "Fete test", null, TypeEvenement.FETE,
            null, null, null, null,
            ZonedDateTime.now().plusDays(7),
            ZonedDateTime.now().plusDays(7).plusHours(4),
            true, true, PublicCible.BENEVOLES, ModeInscription.OBLIGATOIRE,
            5, 20, UUID.randomUUID()
        );
        evenementPublie.setId(evenementId);
        evenementPublie.transitionnerVers(StatutEvenement.PUBLIE, null);
    }

    // -- Matrice d'acces STAFF --

    @Test
    void inscrireStaff_benevoleAutoriseSiABesoiNStaff() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(false);
        when(participationRepository.countByEvenementIdAndRole(any(), eq(RoleParticipation.STAFF)))
            .thenReturn(0L);
        when(participationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ParticipationEvenementResponse response =
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.STAFF, List.of("benevole"));

        assertThat(response.role()).isEqualTo("STAFF");
        verify(participationRepository).save(any(ParticipationEvenement.class));
    }

    @Test
    void inscrireStaff_echoueSiPasBenevole() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(false);

        assertThatThrownBy(() ->
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.STAFF, List.of("beneficiaire")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("bénévoles");
    }

    @Test
    void inscrireStaff_echoueSiABesoiNStaffFalse() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        evenementPublie.setABesoiNStaff(false);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(false);

        assertThatThrownBy(() ->
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.STAFF, List.of("benevole")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("staff");
    }

    // -- Matrice d'acces PARTICIPANT --

    @Test
    void inscrireParticipant_benevoleAutoriseSiPublicBENEVOLES() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(false);
        when(participationRepository.countByEvenementIdAndRole(any(), eq(RoleParticipation.PARTICIPANT)))
            .thenReturn(0L);
        when(participationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ParticipationEvenementResponse response =
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.PARTICIPANT, List.of("benevole"));

        assertThat(response.role()).isEqualTo("PARTICIPANT");
    }

    @Test
    void inscrireParticipant_beneficiaireRefuseSiPublicBENEVOLES() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(false);

        assertThatThrownBy(() ->
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.PARTICIPANT,
                List.of("beneficiaire")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("public cible");
    }

    @Test
    void inscrireParticipant_tousAutorisesAvecPublicTOUS() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        evenementPublie.setPublicParticipants(PublicCible.TOUS);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(false);
        when(participationRepository.countByEvenementIdAndRole(any(), eq(RoleParticipation.PARTICIPANT)))
            .thenReturn(0L);
        when(participationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.inscrire(evenementId, "benevole@test.com", RoleParticipation.PARTICIPANT,
            List.of("beneficiaire"));

        verify(participationRepository).save(any(ParticipationEvenement.class));
    }

    @Test
    void inscrireParticipant_echoueSiNonOuvert() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        evenementPublie.setOuvertParticipants(false);
        evenementPublie.setPublicParticipants(null);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(false);

        assertThatThrownBy(() ->
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.PARTICIPANT, List.of("benevole")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("ouvert");
    }

    @Test
    void inscrire_echoueSiCapaciteStaffAtteinte() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(false);
        when(participationRepository.countByEvenementIdAndRole(any(), eq(RoleParticipation.STAFF)))
            .thenReturn(5L);

        assertThatThrownBy(() ->
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.STAFF, List.of("benevole")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("capacité");
    }

    @Test
    void inscrire_echoueSiDejaInscrit() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.existsByEvenementIdAndPersonneIdAndRole(any(), any(), any()))
            .thenReturn(true);

        assertThatThrownBy(() ->
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.STAFF, List.of("benevole")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("déjà inscrit");
    }

    @Test
    void inscrire_echoueSiEvenementBrouillon() {
        Evenement brouillon = new Evenement(
            "Brouillon", null, TypeEvenement.AUTRE,
            null, null, null, null,
            ZonedDateTime.now().plusDays(1),
            ZonedDateTime.now().plusDays(1).plusHours(2),
            true, false, null, ModeInscription.LIBRE,
            null, null, UUID.randomUUID()
        );
        brouillon.setId(evenementId);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(brouillon));

        assertThatThrownBy(() ->
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.STAFF, List.of("benevole")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("ouvert");
    }

    @Test
    void inscrire_echoueSiSansInscription() {
        evenementPublie.setModeInscription(ModeInscription.SANS_INSCRIPTION);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));

        assertThatThrownBy(() ->
            service.inscrire(evenementId, "benevole@test.com", RoleParticipation.STAFF, List.of("benevole")))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("sans inscription");
    }

    @Test
    void seDesinscrire_supprimeLaParticipation() {
        when(personneQueryPort.trouverPersonne("benevole@test.com"))
            .thenReturn(new PersonneInfo(personneId, "Benevole", "Test"));
        ParticipationEvenement participation =
            new ParticipationEvenement(evenementId, personneId, RoleParticipation.STAFF);
        when(participationRepository.findByEvenementIdOrderByDateInscriptionAsc(evenementId))
            .thenReturn(List.of(participation));

        service.seDesinscrire(evenementId, "benevole@test.com");

        verify(participationRepository).deleteAll(any());
    }

    @Test
    void listerPourPointage_echoueSiModeLIBRE() {
        evenementPublie.setModeInscription(ModeInscription.LIBRE);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));

        assertThatThrownBy(() -> service.listerPourPointage(evenementId, null))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("OBLIGATOIRE");
    }

    @Test
    void pointer_metAJourLaPresence() {
        when(personneQueryPort.trouverPersonneParId(personneId))
            .thenReturn(new PersonneContactInfo(personneId, "benevole@test.com", "Test", "Benevole"));
        UUID participationId = UUID.randomUUID();
        ParticipationEvenement participation =
            new ParticipationEvenement(evenementId, personneId, RoleParticipation.STAFF);
        participation.setId(participationId);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));
        when(participationRepository.findById(participationId)).thenReturn(Optional.of(participation));
        when(participationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ParticipationEvenementResponse response = service.pointer(evenementId, participationId, "PRESENT");

        assertThat(response.presence()).isEqualTo("PRESENT");
    }

    @Test
    void pointer_echoueSiModeSansInscription() {
        evenementPublie.setModeInscription(ModeInscription.SANS_INSCRIPTION);
        when(evenementRepository.findById(evenementId)).thenReturn(Optional.of(evenementPublie));

        assertThatThrownBy(() -> service.pointer(evenementId, UUID.randomUUID(), "PRESENT"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("OBLIGATOIRE");
    }
}