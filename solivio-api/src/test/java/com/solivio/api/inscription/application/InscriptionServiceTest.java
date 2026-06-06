package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.StatutPresence;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.kafka.InscriptionEventPublisher;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.web.dto.InscriptionResponse;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
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
class InscriptionServiceTest {

    @Mock private InscriptionRepository inscriptionRepository;
    @Mock private DistributionQueryPort distributionQueryPort;
    @Mock private PersonneQueryPort personneQueryPort;
    @Mock private InscriptionEventPublisher eventPublisher;

    private InscriptionService service;

    private UUID distributionId;
    private UUID personneId;
    private UUID inscriptionId;

    private DistributionQueryPort.DistributionInfo distribPubliee;
    private PersonneQueryPort.PersonneInfo personne;

    @BeforeEach
    void setUp() {
        service = new InscriptionService(
            inscriptionRepository, distributionQueryPort, personneQueryPort, eventPublisher
        );
        distributionId = UUID.randomUUID();
        personneId = UUID.randomUUID();
        inscriptionId = UUID.randomUUID();

        distribPubliee = new DistributionQueryPort.DistributionInfo(
            distributionId, "PUBLIEE", 50, 10, "CRENEAU_UNIQUE"
        );
        personne = new PersonneQueryPort.PersonneInfo(personneId, "Dupont", "Marie");
    }

    // --- RG2 : unicite par distribution ---

    @Test
    void inscrire_echoueSiDejaInscritComeBeneficiaire() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        Inscription existante = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)
        ).thenReturn(Optional.of(existante));

        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, "tenant1"
        ))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("deja inscrit");
    }

    @Test
    void inscrire_autoriseSiInscriptionPrecedenteAnnulee() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        Inscription ancienne = inscriptionBeneficiaire(personneId, StatutInscription.ANNULEE);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)
        ).thenReturn(Optional.of(ancienne));

        when(inscriptionRepository.compterInscriptionsConfirmeesPeriode(
            eq(personneId), any(Instant.class), any(Instant.class))
        ).thenReturn(0L);

        when(inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)
        ).thenReturn(0L);

        when(inscriptionRepository.save(any(Inscription.class))).thenAnswer(inv -> {
            Inscription i = inv.getArgument(0);
            i.setId(inscriptionId);
            return i;
        });

        InscriptionResponse response = service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, "tenant1"
        );

        assertThat(response.statut()).isEqualTo("CONFIRMEE");
    }

    // --- RG1 : frequence ---

    @Test
    void inscrire_echoueSiBeneficiaireADejaUneInscriptionCetteSemaine() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)
        ).thenReturn(Optional.empty());

        when(inscriptionRepository.compterInscriptionsConfirmeesPeriode(
            eq(personneId), any(Instant.class), any(Instant.class))
        ).thenReturn(1L);

        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, "tenant1"
        ))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("frequence");
    }

    @Test
    void inscrire_benevolePasLimiteParLaFrequence() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("ben@example.com")).thenReturn(
            new PersonneQueryPort.PersonneInfo(personneId, "Bernard", "Leon")
        );
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEVOLE)
        ).thenReturn(Optional.empty());

        when(inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEVOLE, StatutInscription.CONFIRMEE)
        ).thenReturn(0L);

        when(inscriptionRepository.save(any(Inscription.class))).thenAnswer(inv -> {
            Inscription i = inv.getArgument(0);
            i.setId(inscriptionId);
            return i;
        });

        InscriptionResponse response = service.inscrire(
            distributionId, "ben@example.com", "BENEVOLE", null, "tenant1"
        );

        assertThat(response.statut()).isEqualTo("CONFIRMEE");
        assertThat(response.roles()).isEqualTo(List.of());
        verify(inscriptionRepository, never()).compterInscriptionsConfirmeesPeriode(any(), any(), any());
    }

    // --- RG3 : liste d'attente et promotion ---

    @Test
    void inscrire_placeEnListeAttenteQuandCapacitePleine() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)
        ).thenReturn(Optional.empty());
        when(inscriptionRepository.compterInscriptionsConfirmeesPeriode(
            eq(personneId), any(Instant.class), any(Instant.class))
        ).thenReturn(0L);

        when(inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)
        ).thenReturn(50L);

        when(inscriptionRepository.findMaxRangListeAttente(distributionId, TypeInscription.BENEFICIAIRE))
            .thenReturn(Optional.of(3));

        when(inscriptionRepository.save(any(Inscription.class))).thenAnswer(inv -> {
            Inscription i = inv.getArgument(0);
            i.setId(inscriptionId);
            return i;
        });

        InscriptionResponse response = service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, "tenant1"
        );

        assertThat(response.statut()).isEqualTo("LISTE_ATTENTE");
        assertThat(response.rangListeAttente()).isEqualTo(4);
        verify(eventPublisher, never()).publierConfirmee(any(), any());
    }

    @Test
    void desinscrire_promeuvoleProchainEnAttente() {
        Inscription confirmee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        confirmee.setId(inscriptionId);
        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(confirmee));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        UUID personneEnAttenteId = UUID.randomUUID();
        Inscription enAttente = inscriptionBeneficiaire(personneEnAttenteId, StatutInscription.LISTE_ATTENTE);
        enAttente.placerEnListeAttente(1);

        when(inscriptionRepository.findFirstByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.LISTE_ATTENTE)
        ).thenReturn(Optional.of(enAttente));

        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(confirmee);

        service.desinscrire(inscriptionId, "marie@example.com", "tenant1");

        verify(eventPublisher).publierAnnulee(confirmee, "tenant1");
        verify(eventPublisher).publierPromue(enAttente, "tenant1");
        assertThat(enAttente.getStatut()).isEqualTo(StatutInscription.CONFIRMEE);
        assertThat(enAttente.getRangListeAttente()).isNull();
    }

    @Test
    void desinscrire_echoueSiInscriptionDejaAnnulee() {
        Inscription annulee = inscriptionBeneficiaire(personneId, StatutInscription.ANNULEE);
        annulee.setId(inscriptionId);
        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(annulee));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        assertThatThrownBy(() -> service.desinscrire(inscriptionId, "marie@example.com", "tenant1"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("deja annulee");
    }

    // --- Pointage ---

    @Test
    void pointer_marqueCommePresent() {
        Inscription confirmee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        confirmee.setId(inscriptionId);
        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(confirmee));

        DistributionQueryPort.DistributionInfo distribEnCours =
            new DistributionQueryPort.DistributionInfo(distributionId, "EN_COURS", 50, 10, "CRENEAU_UNIQUE");
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribEnCours);

        UUID pointeurId = UUID.randomUUID();
        when(personneQueryPort.trouverPersonne("coord@example.com")).thenReturn(
            new PersonneQueryPort.PersonneInfo(pointeurId, "Coord", "Jean")
        );
        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(confirmee);

        InscriptionResponse response =
            service.pointer(inscriptionId, "PRESENT", "coord@example.com", "tenant1");

        assertThat(response.presence()).isEqualTo("PRESENT");
    }

    @Test
    void pointer_echoueSiDistributionNonEnCours() {
        Inscription confirmee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        confirmee.setId(inscriptionId);
        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.of(confirmee));

        DistributionQueryPort.DistributionInfo distribPubliee =
            new DistributionQueryPort.DistributionInfo(distributionId, "PUBLIEE", 50, 10, "CRENEAU_UNIQUE");
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);

        assertThatThrownBy(() -> service.pointer(inscriptionId, "PRESENT", "coord@example.com", "tenant1"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("en cours");
    }

    @Test
    void pointer_echoueSiInscriptionInexistante() {
        when(inscriptionRepository.findById(inscriptionId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.pointer(inscriptionId, "PRESENT", "coord@example.com", "tenant1"))
            .isInstanceOf(NotFoundException.class);
    }

    // --- Distribution non publiee ---

    @Test
    void inscrire_echoueSiDistributionEnBrouillon() {
        DistributionQueryPort.DistributionInfo brouillon =
            new DistributionQueryPort.DistributionInfo(distributionId, "BROUILLON", 50, 10, "CRENEAU_UNIQUE");
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(brouillon);

        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, "tenant1"
        ))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("publiee");
    }

    @Test
    void inscrire_echoueSiTypeInvalide() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);

        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "INCONNU", null, "tenant1"
        ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("invalide");
    }

    // --- RG4 : comptage des absences ---

    @Test
    void listerInscritsDistribution_inclutNombreAbsencesPassees() {
        Inscription benef = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        benef.setId(inscriptionId);
        when(inscriptionRepository.findByDistributionIdOrderByNomAscPrenomAsc(distributionId))
            .thenReturn(List.of(benef));
        // doReturn contourne l'ambiguite de type generique sur List<Object[]> avec Mockito.
        List<Object[]> absences = new java.util.ArrayList<>();
        absences.add(new Object[]{personneId, 3L});
        org.mockito.Mockito.doReturn(absences)
            .when(inscriptionRepository).compterAbsencesParPersonnes(List.of(personneId));

        List<InscriptionResponse> result = service.listerInscritsDistribution(distributionId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).nombreAbsencesPassees()).isEqualTo(3L);
    }

    @Test
    void listerInscritsDistribution_absencesAZeroSiAucuneAbsenceConnue() {
        Inscription benef = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        benef.setId(inscriptionId);
        when(inscriptionRepository.findByDistributionIdOrderByNomAscPrenomAsc(distributionId))
            .thenReturn(List.of(benef));
        List<Object[]> absencesVides = new java.util.ArrayList<>();
        org.mockito.Mockito.doReturn(absencesVides)
            .when(inscriptionRepository).compterAbsencesParPersonnes(List.of(personneId));

        List<InscriptionResponse> result = service.listerInscritsDistribution(distributionId);

        assertThat(result.get(0).nombreAbsencesPassees()).isEqualTo(0L);
    }

    // --- Helpers ---

    private Inscription inscriptionBeneficiaire(UUID pId, StatutInscription statut) {
        Inscription i = new Inscription(
            distributionId, null, pId, "Dupont", "Marie", TypeInscription.BENEFICIAIRE
        );
        if (statut == StatutInscription.ANNULEE) {
            i.annuler();
        } else if (statut == StatutInscription.LISTE_ATTENTE) {
            i.placerEnListeAttente(1);
        }
        return i;
    }
}
