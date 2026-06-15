package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.PointageAdHoc;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.StatutPresence;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.persistence.PointageAdHocRepository;
import com.solivio.api.inscription.infrastructure.web.dto.PointageAdHocResponse;
import com.solivio.api.inscription.infrastructure.web.dto.PointageInfoResponse;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.InvitationPort;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PointageAdHocServiceTest {

    @Mock private PointageAdHocRepository adHocRepository;
    @Mock private InscriptionRepository inscriptionRepository;
    @Mock private PersonneQueryPort personneQueryPort;
    @Mock private DistributionQueryPort distributionQueryPort;
    @Mock private InvitationPort invitationPort;

    @InjectMocks
    private PointageAdHocService service;

    private final UUID distributionId = UUID.randomUUID();
    private final UUID personneId = UUID.randomUUID();
    private final UUID pointeParId = UUID.randomUUID();

    private DistributionQueryPort.DistributionInfo distribEnCours() {
        return new DistributionQueryPort.DistributionInfo(
            distributionId, "EN_COURS", 50, 20, "CRENEAU_UNIQUE", "INSCRITS", LocalDate.now()
        );
    }

    private static final String EMAIL_COORD = "coord@test.com";
    private final UUID pointeurPersonneId = UUID.randomUUID();

    private void stubDistribEtPersonne() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribEnCours());
        when(personneQueryPort.trouverPersonneParId(personneId))
            .thenReturn(new PersonneQueryPort.PersonneContactInfo(personneId, "alice@test.com", "Alice", "Martin"));
        when(personneQueryPort.trouverPersonne(EMAIL_COORD))
            .thenReturn(new PersonneQueryPort.PersonneInfo(pointeurPersonneId, "Coord", "Test"));
    }

    @Test
    void ajouterCompteExistant_creerInscriptionSiAbsente() {
        stubDistribEtPersonne();
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEVOLE
        )).thenReturn(Optional.empty());

        ArgumentCaptor<Inscription> captor = ArgumentCaptor.forClass(Inscription.class);
        when(inscriptionRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        PointageInfoResponse result = service.ajouterCompteExistant(distributionId, personneId, EMAIL_COORD);

        Inscription saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(TypeInscription.BENEVOLE);
        assertThat(saved.getStatut()).isEqualTo(StatutInscription.CONFIRMEE);
        assertThat(saved.getPresence()).isEqualTo(StatutPresence.PRESENT);
        assertThat(result.presence()).isEqualTo("PRESENT");
    }

    @Test
    void ajouterCompteExistant_reinscritSiAnnulee() {
        stubDistribEtPersonne();
        Inscription existante = new Inscription(
            distributionId, null, personneId, "Martin", "Alice", TypeInscription.BENEVOLE
        );
        existante.annuler();
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEVOLE
        )).thenReturn(Optional.of(existante));
        when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        PointageInfoResponse result = service.ajouterCompteExistant(distributionId, personneId, EMAIL_COORD);

        assertThat(existante.getStatut()).isEqualTo(StatutInscription.CONFIRMEE);
        assertThat(existante.getPresence()).isEqualTo(StatutPresence.PRESENT);
        assertThat(result.presence()).isEqualTo("PRESENT");
    }

    @Test
    void ajouterCompteExistant_marqueDirectementPresentSiConfirmee() {
        stubDistribEtPersonne();
        Inscription existante = new Inscription(
            distributionId, null, personneId, "Martin", "Alice", TypeInscription.BENEVOLE
        );
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEVOLE
        )).thenReturn(Optional.of(existante));
        when(inscriptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.ajouterCompteExistant(distributionId, personneId, EMAIL_COORD);

        assertThat(existante.getPresence()).isEqualTo(StatutPresence.PRESENT);
    }

    @Test
    void ajouterCompteExistant_echoueSiDistributionBrouillon() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(
            new DistributionQueryPort.DistributionInfo(
                distributionId, "BROUILLON", 50, 20, "CRENEAU_UNIQUE", "INSCRITS", LocalDate.now()
            )
        );

        assertThatThrownBy(() -> service.ajouterCompteExistant(distributionId, personneId, EMAIL_COORD))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("BROUILLON");
    }

    @Test
    void ajouterVisiteur_creeEnregistrementAdHoc() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribEnCours());
        PointageAdHoc saved = new PointageAdHoc(distributionId, "Dupont", "Jean", "jean@test.com", "Accueil");
        when(adHocRepository.save(any())).thenReturn(saved);

        PointageAdHocResponse result = service.ajouterVisiteur(
            distributionId, "Dupont", "Jean", "jean@test.com", "Accueil"
        );

        assertThat(result.nom()).isEqualTo("Dupont");
        assertThat(result.prenom()).isEqualTo("Jean");
        assertThat(result.email()).isEqualTo("jean@test.com");
        assertThat(result.presence()).isEqualTo("PRESENT");
        assertThat(result.invitationEnvoyee()).isFalse();
    }

    @Test
    void ajouterVisiteur_normaliseEmailVide() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribEnCours());
        PointageAdHoc saved = new PointageAdHoc(distributionId, "Dupont", "Jean", null, null);
        ArgumentCaptor<PointageAdHoc> captor = ArgumentCaptor.forClass(PointageAdHoc.class);
        when(adHocRepository.save(captor.capture())).thenReturn(saved);

        service.ajouterVisiteur(distributionId, "Dupont", "Jean", "   ", null);

        assertThat(captor.getValue().getEmail()).isNull();
    }

    @Test
    void envoyerInvitation_envoieEtMarqueLInvitation() {
        UUID adHocId = UUID.randomUUID();
        PointageAdHoc adHoc = new PointageAdHoc(distributionId, "Dupont", "Jean", "jean@test.com", null);
        when(adHocRepository.findById(adHocId)).thenReturn(Optional.of(adHoc));
        when(adHocRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.envoyerInvitation(adHocId, pointeParId, "asso-test");

        verify(invitationPort).inviterBenevole("jean@test.com", pointeParId, "asso-test");
        assertThat(adHoc.isInvitationEnvoyee()).isTrue();
    }

    @Test
    void envoyerInvitation_echoueSiEmailAbsent() {
        UUID adHocId = UUID.randomUUID();
        PointageAdHoc adHoc = new PointageAdHoc(distributionId, "Dupont", "Jean", null, null);
        when(adHocRepository.findById(adHocId)).thenReturn(Optional.of(adHoc));

        assertThatThrownBy(() -> service.envoyerInvitation(adHocId, pointeParId, "asso-test"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("email");

        verify(invitationPort, never()).inviterBenevole(any(), any(), any());
    }

    @Test
    void envoyerInvitation_echoueSiDejaEnvoyee() {
        UUID adHocId = UUID.randomUUID();
        PointageAdHoc adHoc = new PointageAdHoc(distributionId, "Dupont", "Jean", "jean@test.com", null);
        adHoc.setInvitationEnvoyee(true);
        when(adHocRepository.findById(adHocId)).thenReturn(Optional.of(adHoc));

        assertThatThrownBy(() -> service.envoyerInvitation(adHocId, pointeParId, "asso-test"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("invitation");

        verify(invitationPort, never()).inviterBenevole(any(), any(), any());
    }

    @Test
    void envoyerInvitation_echoueSiAdHocInexistant() {
        UUID adHocId = UUID.randomUUID();
        when(adHocRepository.findById(adHocId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.envoyerInvitation(adHocId, pointeParId, "asso-test"))
            .isInstanceOf(NotFoundException.class);
    }
}
