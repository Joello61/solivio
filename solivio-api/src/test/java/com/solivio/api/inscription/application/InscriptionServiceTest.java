package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.StatutPresence;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.evenements.InscriptionEventPublisher;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.persistence.VerrouDistribution;
import com.solivio.api.inscription.infrastructure.web.dto.InscriptionResponse;
import com.solivio.api.shared.association.AssociationQueryPort;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.exception.ConflictException;
import com.solivio.api.shared.exception.NotFoundException;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.temps.HorlogeAssociation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authorization.AuthorizationDeniedException;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InscriptionServiceTest {

    @Mock private InscriptionRepository inscriptionRepository;
    @Mock private DistributionQueryPort distributionQueryPort;
    @Mock private PersonneQueryPort personneQueryPort;
    @Mock private AssociationQueryPort associationQueryPort;
    @Mock private InscriptionEventPublisher eventPublisher;
    @Mock private VerrouDistribution verrouDistribution;

    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");

    private InscriptionService service;

    private UUID distributionId;
    private UUID personneId;
    private UUID inscriptionId;

    private static final Set<String> ROLES_BENEFICIAIRE = Set.of("beneficiaire");
    private static final Set<String> ROLES_BENEVOLE = Set.of("benevole");

    private DistributionQueryPort.DistributionInfo distribPubliee;
    private PersonneQueryPort.PersonneInfo personne;

    @BeforeEach
    void setUp() {
        service = new InscriptionService(
            inscriptionRepository, distributionQueryPort, personneQueryPort,
            associationQueryPort, eventPublisher, verrouDistribution,
            new HorlogeAssociation(Clock.systemUTC(), associationQueryPort)
        );
        lenient().when(associationQueryPort.fuseauHoraire()).thenReturn(PARIS);
        distributionId = UUID.randomUUID();
        personneId = UUID.randomUUID();
        inscriptionId = UUID.randomUUID();

        distribPubliee = new DistributionQueryPort.DistributionInfo(
            distributionId, "PUBLIEE", 50, 10, "CRENEAU_UNIQUE", "INSCRITS",
            java.time.LocalDate.now().plusDays(3)
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
            distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE
        ))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("deja inscrit");
    }

    @Test
    void inscrire_echoueSiDejaEnListeAttente() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        Inscription enAttente = inscriptionBeneficiaire(personneId, StatutInscription.LISTE_ATTENTE);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)
        ).thenReturn(Optional.of(enAttente));

        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE
        ))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("deja inscrit");
    }

    @Test
    void inscrire_reactiveInscriptionAnnuleeExistante() {
        // Scenario : desinscription puis reinscription -> la ligne ANNULEE est reactivee,
        // aucune nouvelle ligne n'est creee.
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        Inscription ancienne = inscriptionBeneficiaire(personneId, StatutInscription.ANNULEE);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)
        ).thenReturn(Optional.of(ancienne));

        when(associationQueryPort.frequenceMaxParSemaine()).thenReturn(1);
        when(inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)
        ).thenReturn(0L);
        when(inscriptionRepository.save(any(Inscription.class))).thenAnswer(inv -> inv.getArgument(0));

        InscriptionResponse response = service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE
        );

        // La ligne reactivee est la meme instance (pas de new Inscription)
        assertThat(response.statut()).isEqualTo("CONFIRMEE");
        // save() appele exactement une fois avec l'inscription reactivee
        verify(inscriptionRepository).save(ancienne);
    }

    // --- RG1 : frequence ---

    @Test
    void inscrire_echoueSiBeneficiaireADejaUneInscriptionCetteSemaine() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)
        ).thenReturn(Optional.empty());

        when(associationQueryPort.frequenceMaxParSemaine()).thenReturn(1);
        UUID autreDistribution = UUID.randomUUID();
        when(distributionQueryPort.trouverIdsNonAnnuleesEntre(any(), any()))
            .thenReturn(List.of(distributionId, autreDistribution));
        when(inscriptionRepository.compterInscriptionsBeneficiaireActives(personneId, List.of(autreDistribution)))
            .thenReturn(1L);

        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE
        ))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("cette semaine");
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
            distributionId, "ben@example.com", "BENEVOLE", null, ROLES_BENEVOLE
        );

        assertThat(response.statut()).isEqualTo("CONFIRMEE");
        assertThat(response.roles()).isEqualTo(List.of());
        verify(inscriptionRepository, never()).compterInscriptionsBeneficiaireActives(any(), any());
    }

    // --- RG3 : liste d'attente et promotion ---

    @Test
    void inscrire_placeEnListeAttenteQuandCapacitePleine() {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)
        ).thenReturn(Optional.empty());
        when(associationQueryPort.frequenceMaxParSemaine()).thenReturn(1);

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
            distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE
        );

        assertThat(response.statut()).isEqualTo("LISTE_ATTENTE");
        assertThat(response.rangListeAttente()).isEqualTo(4);
        verify(eventPublisher, never()).publierConfirmee(any());
    }

    @Test
    void desinscrire_promeuvoleProchainEnAttente() {
        Inscription confirmee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        confirmee.setId(inscriptionId);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(confirmee));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        UUID personneEnAttenteId = UUID.randomUUID();
        Inscription enAttente = inscriptionBeneficiaire(personneEnAttenteId, StatutInscription.LISTE_ATTENTE);
        enAttente.placerEnListeAttente(1);

        when(inscriptionRepository.findByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.LISTE_ATTENTE)
        ).thenReturn(List.of(enAttente));

        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(confirmee);
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);

        service.desinscrire(distributionId, inscriptionId, "marie@example.com");

        verify(eventPublisher).publierPromue(enAttente);
        assertThat(enAttente.getStatut()).isEqualTo(StatutInscription.CONFIRMEE);
        assertThat(enAttente.getRangListeAttente()).isNull();
    }

    @Test
    void desinscrire_echoueSiInscriptionDejaAnnulee() {
        Inscription annulee = inscriptionBeneficiaire(personneId, StatutInscription.ANNULEE);
        annulee.setId(inscriptionId);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(annulee));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        assertThatThrownBy(() -> service.desinscrire(
            distributionId, inscriptionId, "marie@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("deja annulee");
    }

    // --- Pointage ---

    @Test
    void pointer_marqueCommePresent() {
        Inscription confirmee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        confirmee.setId(inscriptionId);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(confirmee));

        DistributionQueryPort.DistributionInfo distribEnCours =
            new DistributionQueryPort.DistributionInfo(distributionId, "EN_COURS", 50, 10, "CRENEAU_UNIQUE", "INSCRITS",
                java.time.LocalDate.now());
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribEnCours);

        UUID pointeurId = UUID.randomUUID();
        when(personneQueryPort.trouverPersonne("coord@example.com")).thenReturn(
            new PersonneQueryPort.PersonneInfo(pointeurId, "Coord", "Jean")
        );
        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(confirmee);

        InscriptionResponse response =
            service.pointer(distributionId, inscriptionId, "PRESENT", "coord@example.com", true);

        assertThat(response.presence()).isEqualTo("PRESENT");
    }

    @Test
    void pointer_echoueSiDistributionNonEnCours() {
        when(personneQueryPort.trouverPersonne("coord@example.com")).thenReturn(personne);
        Inscription confirmee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        confirmee.setId(inscriptionId);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(confirmee));

        DistributionQueryPort.DistributionInfo distribPubliee =
            new DistributionQueryPort.DistributionInfo(distributionId, "PUBLIEE", 50, 10, "CRENEAU_UNIQUE", "INSCRITS",
                java.time.LocalDate.now().plusDays(5));
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribPubliee);

        assertThatThrownBy(() -> service.pointer(
            distributionId, inscriptionId, "PRESENT", "coord@example.com", true))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("en cours");
    }

    @Test
    void pointer_echoueSiInscriptionInexistante() {
        when(personneQueryPort.trouverPersonne("coord@example.com")).thenReturn(personne);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.pointer(
            distributionId, inscriptionId, "PRESENT", "coord@example.com", true))
            .isInstanceOf(NotFoundException.class);
    }

    // --- Distribution non publiee ---

    @Test
    void inscrire_echoueSiDistributionEnBrouillon() {
        DistributionQueryPort.DistributionInfo brouillon =
            new DistributionQueryPort.DistributionInfo(distributionId, "BROUILLON", 50, 10, "CRENEAU_UNIQUE", "INSCRITS",
                java.time.LocalDate.now().plusDays(7));
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(brouillon);

        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE
        ))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("publiee");
    }

    @Test
    void inscrire_echoueSiTypeInvalide() {
        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "INCONNU", null, ROLES_BENEFICIAIRE
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

    // --- Desistement tardif benevole ---

    @Test
    void desinscrire_publieDesistementTardifSiBenevoleConfirmeEtDistributionImminente() {
        Inscription benevoleConfirme = inscriptionBenevole(personneId, StatutInscription.CONFIRMEE);
        benevoleConfirme.setId(inscriptionId);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(benevoleConfirme));
        when(personneQueryPort.trouverPersonne("ben@example.com")).thenReturn(personne);

        DistributionQueryPort.DistributionInfo distribAujourdhui =
            new DistributionQueryPort.DistributionInfo(distributionId, "PUBLIEE", 50, 10,
                "CRENEAU_UNIQUE", "INSCRITS", java.time.LocalDate.now());
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribAujourdhui);
        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(benevoleConfirme);
        when(inscriptionRepository.findByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
            any(), any(), any())).thenReturn(List.of());

        service.desinscrire(distributionId, inscriptionId, "ben@example.com");

        verify(eventPublisher).publierDesistementTardifBenevole(benevoleConfirme);
    }

    @Test
    void desinscrire_nePubliePasDesistementSiDistributionLointaine() {
        Inscription benevoleConfirme = inscriptionBenevole(personneId, StatutInscription.CONFIRMEE);
        benevoleConfirme.setId(inscriptionId);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(benevoleConfirme));
        when(personneQueryPort.trouverPersonne("ben@example.com")).thenReturn(personne);

        DistributionQueryPort.DistributionInfo distribLointaine =
            new DistributionQueryPort.DistributionInfo(distributionId, "PUBLIEE", 50, 10,
                "CRENEAU_UNIQUE", "INSCRITS", java.time.LocalDate.now().plusDays(7));
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(distribLointaine);
        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(benevoleConfirme);
        when(inscriptionRepository.findByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
            any(), any(), any())).thenReturn(List.of());

        service.desinscrire(distributionId, inscriptionId, "ben@example.com");

        verify(eventPublisher, never()).publierDesistementTardifBenevole(any());
    }

    // I7 : a 0h30 a Paris, il est encore la veille en UTC ; une distribution du
    // lendemain (heure de Paris) rend bien le desistement tardif.
    @Test
    void desinscrire_desistementTardifCalculeDansLeFuseauDeLAssociation() {
        Clock minuitTrenteAParis = Clock.fixed(Instant.parse("2026-10-14T22:30:00Z"), ZoneOffset.UTC);
        InscriptionService serviceAMinuit = new InscriptionService(
            inscriptionRepository, distributionQueryPort, personneQueryPort,
            associationQueryPort, eventPublisher, verrouDistribution,
            new HorlogeAssociation(minuitTrenteAParis, associationQueryPort));
        Inscription benevoleConfirme = inscriptionBenevole(personneId, StatutInscription.CONFIRMEE);
        benevoleConfirme.setId(inscriptionId);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(benevoleConfirme));
        when(personneQueryPort.trouverPersonne("ben@example.com")).thenReturn(personne);
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(
            new DistributionQueryPort.DistributionInfo(distributionId, "PUBLIEE", 50, 10,
                "CRENEAU_UNIQUE", "INSCRITS", java.time.LocalDate.of(2026, 10, 16)));
        when(inscriptionRepository.save(any(Inscription.class))).thenReturn(benevoleConfirme);
        when(inscriptionRepository.findByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
            any(), any(), any())).thenReturn(List.of());

        serviceAMinuit.desinscrire(distributionId, inscriptionId, "ben@example.com");

        verify(eventPublisher).publierDesistementTardifBenevole(benevoleConfirme);
    }

    // --- C3 : capacite par creneau ---

    @Test
    void inscrire_placeEnAttenteQuandLeCreneauEstPleinMemeSiLaDistributionALaPlace() {
        UUID creneauId = UUID.randomUUID();
        preparerInscriptionDecoupee(creneauId, 2);
        when(inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)).thenReturn(2L);
        when(inscriptionRepository.countByDistributionIdAndCreneauIdAndTypeAndStatut(
            distributionId, creneauId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)).thenReturn(2L);

        InscriptionResponse response = service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", creneauId, ROLES_BENEFICIAIRE);

        assertThat(response.statut()).isEqualTo("LISTE_ATTENTE");
        verify(verrouDistribution).verrouiller(distributionId);
    }

    @Test
    void inscrire_placeEnAttenteQuandLaDistributionEstPleineMemeSiLeCreneauALaPlace() {
        UUID creneauId = UUID.randomUUID();
        preparerInscriptionDecoupee(creneauId, 20);
        when(inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)).thenReturn(50L);

        InscriptionResponse response = service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", creneauId, ROLES_BENEFICIAIRE);

        assertThat(response.statut()).isEqualTo("LISTE_ATTENTE");
    }

    @Test
    void inscrire_confirmeQuandLeCreneauEtLaDistributionOntDeLaPlace() {
        UUID creneauId = UUID.randomUUID();
        preparerInscriptionDecoupee(creneauId, 2);
        when(inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)).thenReturn(10L);
        when(inscriptionRepository.countByDistributionIdAndCreneauIdAndTypeAndStatut(
            distributionId, creneauId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)).thenReturn(1L);

        InscriptionResponse response = service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", creneauId, ROLES_BENEFICIAIRE);

        assertThat(response.statut()).isEqualTo("CONFIRMEE");
    }

    @Test
    void desinscrire_promeutLaPremierePersonneEnAttenteDontLeCreneauALaPlace() {
        UUID creneauPlein = UUID.randomUUID();
        UUID creneauLibere = UUID.randomUUID();
        DistributionQueryPort.DistributionInfo decoupee = new DistributionQueryPort.DistributionInfo(
            distributionId, "PUBLIEE", 50, 10, "CRENEAUX_DECOUPES", "INSCRITS",
            java.time.LocalDate.now().plusDays(3));
        Inscription confirmee = new Inscription(
            distributionId, creneauLibere, personneId, "Dupont", "Marie", TypeInscription.BENEFICIAIRE);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(confirmee));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(decoupee);

        Inscription premiere = new Inscription(
            distributionId, creneauPlein, UUID.randomUUID(), "A", "A", TypeInscription.BENEFICIAIRE);
        premiere.placerEnListeAttente(1);
        Inscription seconde = new Inscription(
            distributionId, creneauLibere, UUID.randomUUID(), "B", "B", TypeInscription.BENEFICIAIRE);
        seconde.placerEnListeAttente(2);
        when(inscriptionRepository.findByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.LISTE_ATTENTE)
        ).thenReturn(List.of(premiere, seconde));
        when(distributionQueryPort.trouverCreneau(creneauPlein, distributionId))
            .thenReturn(new DistributionQueryPort.CreneauInfo(creneauPlein, 1, null, null));
        when(distributionQueryPort.trouverCreneau(creneauLibere, distributionId))
            .thenReturn(new DistributionQueryPort.CreneauInfo(creneauLibere, 1, null, null));
        when(inscriptionRepository.countByDistributionIdAndCreneauIdAndTypeAndStatut(
            distributionId, creneauPlein, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)).thenReturn(1L);
        when(inscriptionRepository.countByDistributionIdAndCreneauIdAndTypeAndStatut(
            distributionId, creneauLibere, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE)).thenReturn(0L);

        service.desinscrire(distributionId, inscriptionId, "marie@example.com");

        assertThat(premiere.getStatut()).isEqualTo(StatutInscription.LISTE_ATTENTE);
        assertThat(seconde.getStatut()).isEqualTo(StatutInscription.CONFIRMEE);
        verify(eventPublisher).publierPromue(seconde);
    }

    private void preparerInscriptionDecoupee(UUID creneauId, int capaciteCreneau) {
        DistributionQueryPort.DistributionInfo decoupee = new DistributionQueryPort.DistributionInfo(
            distributionId, "PUBLIEE", 50, 10, "CRENEAUX_DECOUPES", "INSCRITS",
            java.time.LocalDate.now().plusDays(3));
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(decoupee);
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)).thenReturn(Optional.empty());
        when(associationQueryPort.frequenceMaxParSemaine()).thenReturn(1);
        when(distributionQueryPort.trouverCreneau(creneauId, distributionId))
            .thenReturn(new DistributionQueryPort.CreneauInfo(creneauId, capaciteCreneau, null, null));
        lenient().when(inscriptionRepository.findMaxRangListeAttente(distributionId, TypeInscription.BENEFICIAIRE))
            .thenReturn(Optional.empty());
        when(inscriptionRepository.save(any(Inscription.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // --- C6 : frequence par semaine calendaire ---

    @Test
    void inscrire_chercheLesDistributionsDuLundiAuDimancheDeLaDistributionVisee() {
        java.time.LocalDate dimanche = java.time.LocalDate.of(2026, 10, 18);
        preparerInscriptionBeneficiaireLe(dimanche, 1);

        service.inscrire(distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE);

        verify(distributionQueryPort).trouverIdsNonAnnuleesEntre(
            java.time.LocalDate.of(2026, 10, 12), dimanche);
    }

    @Test
    void inscrire_autoriseSousUneLimiteConfigureeADeux() {
        preparerInscriptionBeneficiaireLe(java.time.LocalDate.of(2026, 10, 14), 2);
        UUID autre = UUID.randomUUID();
        when(distributionQueryPort.trouverIdsNonAnnuleesEntre(any(), any())).thenReturn(List.of(autre));
        when(inscriptionRepository.compterInscriptionsBeneficiaireActives(personneId, List.of(autre)))
            .thenReturn(1L);

        InscriptionResponse response = service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE);

        assertThat(response.statut()).isEqualTo("CONFIRMEE");
    }

    @Test
    void inscrire_refuseQuandLaLimiteConfigureeEstAtteinte() {
        preparerInscriptionBeneficiaireLe(java.time.LocalDate.of(2026, 10, 14), 2);
        List<UUID> autres = List.of(UUID.randomUUID(), UUID.randomUUID());
        when(distributionQueryPort.trouverIdsNonAnnuleesEntre(any(), any())).thenReturn(autres);
        when(inscriptionRepository.compterInscriptionsBeneficiaireActives(personneId, autres)).thenReturn(2L);

        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "BENEFICIAIRE", null, ROLES_BENEFICIAIRE))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("2 distributions cette semaine");
    }

    private void preparerInscriptionBeneficiaireLe(java.time.LocalDate date, int limite) {
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(
            new DistributionQueryPort.DistributionInfo(distributionId, "PUBLIEE", 50, 10,
                "CRENEAU_UNIQUE", "INSCRITS", date));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);
        when(inscriptionRepository.findByDistributionIdAndPersonneIdAndType(
            distributionId, personneId, TypeInscription.BENEFICIAIRE)).thenReturn(Optional.empty());
        when(associationQueryPort.frequenceMaxParSemaine()).thenReturn(limite);
        lenient().when(inscriptionRepository.save(any(Inscription.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // --- C5 : annulation d'une distribution ---

    @Test
    void annulerToutesPourDistribution_annuleConfirmeesEtAttenteSansPromotion() {
        Inscription confirmee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        Inscription enAttente = inscriptionBeneficiaire(UUID.randomUUID(), StatutInscription.LISTE_ATTENTE);
        List<Inscription> actives = List.of(confirmee, enAttente);
        when(inscriptionRepository.findByDistributionIdAndStatutIn(
            distributionId, List.of(StatutInscription.CONFIRMEE, StatutInscription.LISTE_ATTENTE))
        ).thenReturn(actives);

        service.annulerToutesPourDistribution(distributionId);

        assertThat(confirmee.getStatut()).isEqualTo(StatutInscription.ANNULEE);
        assertThat(enAttente.getStatut()).isEqualTo(StatutInscription.ANNULEE);
        verify(verrouDistribution).verrouiller(distributionId);
        verify(eventPublisher).publierAnnuleesParDistribution(distributionId, actives);
        verify(eventPublisher, never()).publierPromue(any());
    }

    @Test
    void annulerToutesPourDistribution_neRepubliePasQuandToutEstDejaAnnule() {
        when(inscriptionRepository.findByDistributionIdAndStatutIn(any(), any())).thenReturn(List.of());

        service.annulerToutesPourDistribution(distributionId);

        verify(eventPublisher, never()).publierAnnuleesParDistribution(any(), any());
        verify(inscriptionRepository, never()).saveAll(any());
    }

    // --- C1 : desinscription reservee au proprietaire ---

    @Test
    void desinscrire_repond404PourLInscriptionDUneAutrePersonne() {
        Inscription autrui = inscriptionBeneficiaire(UUID.randomUUID(), StatutInscription.CONFIRMEE);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(autrui));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        assertThatThrownBy(() -> service.desinscrire(distributionId, inscriptionId, "marie@example.com"))
            .isInstanceOf(NotFoundException.class);
        assertThat(autrui.getStatut()).isEqualTo(StatutInscription.CONFIRMEE);
        verify(inscriptionRepository, never()).save(any());
    }

    @Test
    void desinscrire_repond404SiLInscriptionNAppartientPasALaDistribution() {
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.desinscrire(distributionId, inscriptionId, "marie@example.com"))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void desinscrire_refuseSiDistributionTerminee() {
        Inscription confirmee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(confirmee));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);
        when(distributionQueryPort.trouverDistribution(distributionId)).thenReturn(
            new DistributionQueryPort.DistributionInfo(distributionId, "TERMINEE", 50, 10,
                "CRENEAU_UNIQUE", "INSCRITS", java.time.LocalDate.now()));

        assertThatThrownBy(() -> service.desinscrire(distributionId, inscriptionId, "marie@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("terminee");
    }

    @Test
    void desinscrire_refuseSiPresenceDejaPointee() {
        Inscription pointee = inscriptionBeneficiaire(personneId, StatutInscription.CONFIRMEE);
        pointee.pointer(StatutPresence.PRESENT, UUID.randomUUID());
        when(inscriptionRepository.findByIdAndDistributionId(inscriptionId, distributionId))
            .thenReturn(Optional.of(pointee));
        when(personneQueryPort.trouverPersonne("marie@example.com")).thenReturn(personne);

        assertThatThrownBy(() -> service.desinscrire(distributionId, inscriptionId, "marie@example.com"))
            .isInstanceOf(ConflictException.class)
            .hasMessageContaining("pointee");
    }

    // --- C2 : role requis selon le type d'inscription ---

    @Test
    void inscrire_refuseUnBeneficiaireEnTantQueBenevole() {
        assertThatThrownBy(() -> service.inscrire(
            distributionId, "marie@example.com", "BENEVOLE", null, ROLES_BENEFICIAIRE
        ))
            .isInstanceOf(AuthorizationDeniedException.class);
        verify(inscriptionRepository, never()).save(any());
    }

    @Test
    void inscrire_refuseUnBenevoleEnTantQueBeneficiaire() {
        assertThatThrownBy(() -> service.inscrire(
            distributionId, "ben@example.com", "BENEFICIAIRE", null, ROLES_BENEVOLE
        ))
            .isInstanceOf(AuthorizationDeniedException.class);
    }

    // --- C4 : pointage limite aux benevoles inscrits ---

    @Test
    void pointer_repond404PourUnBenevoleNonInscritALaDistribution() {
        when(personneQueryPort.trouverPersonne("ben@example.com")).thenReturn(personne);
        when(inscriptionRepository.existsByDistributionIdAndPersonneIdAndTypeAndStatut(
            distributionId, personneId, TypeInscription.BENEVOLE, StatutInscription.CONFIRMEE)
        ).thenReturn(false);

        assertThatThrownBy(() -> service.pointer(
            distributionId, inscriptionId, "PRESENT", "ben@example.com", false))
            .isInstanceOf(NotFoundException.class);
        verify(inscriptionRepository, never()).findByIdAndDistributionId(any(), any());
    }

    @Test
    void rechercherPourPointage_repond404PourUnBenevoleNonInscrit() {
        when(personneQueryPort.trouverPersonne("ben@example.com")).thenReturn(personne);
        when(inscriptionRepository.existsByDistributionIdAndPersonneIdAndTypeAndStatut(
            distributionId, personneId, TypeInscription.BENEVOLE, StatutInscription.CONFIRMEE)
        ).thenReturn(false);

        assertThatThrownBy(() -> service.rechercherPourPointage(distributionId, "Du", "ben@example.com", false))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void rechercherPourPointage_autoriseUnBenevoleInscritConfirme() {
        when(personneQueryPort.trouverPersonne("ben@example.com")).thenReturn(personne);
        when(inscriptionRepository.existsByDistributionIdAndPersonneIdAndTypeAndStatut(
            distributionId, personneId, TypeInscription.BENEVOLE, StatutInscription.CONFIRMEE)
        ).thenReturn(true);
        when(inscriptionRepository.rechercherPourPointage(distributionId, "Du")).thenReturn(List.of());

        assertThat(service.rechercherPourPointage(distributionId, "Du", "ben@example.com", false)).isEmpty();
    }

    // --- Helpers ---

    private Inscription inscriptionBenevole(UUID pId, StatutInscription statut) {
        Inscription i = new Inscription(
            distributionId, null, pId, "Dupont", "Marie", TypeInscription.BENEVOLE
        );
        if (statut == StatutInscription.ANNULEE) {
            i.annuler();
        } else if (statut == StatutInscription.LISTE_ATTENTE) {
            i.placerEnListeAttente(1);
        }
        return i;
    }

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
