package com.solivio.api.distribution.application;

import com.solivio.api.audit.application.AuditService;
import com.solivio.api.distribution.domain.Creneau;
import com.solivio.api.distribution.domain.Distribution;
import com.solivio.api.distribution.domain.ModeCreneauDistribution;
import com.solivio.api.distribution.domain.StatutDistribution;
import com.solivio.api.distribution.infrastructure.evenements.DistributionEventPublisher;
import com.solivio.api.distribution.infrastructure.persistence.CreneauRepository;
import com.solivio.api.distribution.infrastructure.persistence.DistributionRepository;
import com.solivio.api.distribution.infrastructure.web.dto.CreneauModifieRequest;
import com.solivio.api.distribution.infrastructure.web.dto.UpdateDistributionRequest;
import com.solivio.api.shared.association.AssociationQueryPort;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import com.solivio.api.shared.temps.HorlogeAssociation;
import com.solivio.api.shared.verrou.VerrouDistribution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ModificationDistributionServiceTest {

    @Mock private DistributionRepository distributionRepository;
    @Mock private CreneauRepository creneauRepository;
    @Mock private DistributionEventPublisher eventPublisher;
    @Mock private InscriptionQueryPort inscriptionQueryPort;
    @Mock private VerrouDistribution verrou;
    @Mock private AssociationQueryPort associationQueryPort;
    @Mock private AuditService auditService;

    private ModificationDistributionService service;
    private Distribution distribution;
    private Creneau creneau;
    private final UUID distributionId = UUID.randomUUID();
    private final LocalDate date = LocalDate.now().plusDays(5);

    @BeforeEach
    void setUp() {
        lenient().when(associationQueryPort.fuseauHoraire()).thenReturn(ZoneId.of("Europe/Paris"));
        service = new ModificationDistributionService(distributionRepository, creneauRepository, eventPublisher,
            inscriptionQueryPort, verrou, new HorlogeAssociation(Clock.systemUTC(), associationQueryPort), auditService);
        distribution = new Distribution("Distribution", null, null, date, 10, 5,
            ModeCreneauDistribution.CRENEAU_UNIQUE, UUID.randomUUID());
        distribution.setId(distributionId);
        creneau = new Creneau(distributionId, LocalTime.of(17, 0), LocalTime.of(19, 0), 10);
        creneau.setId(UUID.randomUUID());
        when(distributionRepository.findById(distributionId)).thenReturn(Optional.of(distribution));
        lenient().when(creneauRepository.findByDistributionIdOrderByHeureDebut(distributionId))
            .thenReturn(List.of(creneau));
        lenient().when(creneauRepository.save(any(Creneau.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(inscriptionQueryPort.compterParCreneau(distributionId)).thenReturn(Map.of());
    }

    @Test
    void renommerUneDistributionPubliee_nePrevientPersonne() {
        distribution.transitionnerVers(StatutDistribution.PUBLIEE, null);

        service.modifier(distributionId, requete("Nouveau titre", date, 10, LocalTime.of(17, 0)));

        verify(eventPublisher, never()).publierModifiee(any(), anyBoolean(), anyBoolean());
    }

    @Test
    void decalerLHoraireDUnCreneau_estUnChangementPratique() {
        distribution.transitionnerVers(StatutDistribution.PUBLIEE, null);

        service.modifier(distributionId, requete("Distribution", date, 10, LocalTime.of(18, 0)));

        verify(eventPublisher).publierModifiee(eq(distributionId), eq(true), eq(false));
    }

    @Test
    void augmenterLaCapacite_signaleDesPlacesOuvertes() {
        distribution.transitionnerVers(StatutDistribution.PUBLIEE, null);

        service.modifier(distributionId, requete("Distribution", date, 12, LocalTime.of(17, 0)));

        verify(eventPublisher).publierModifiee(eq(distributionId), eq(false), eq(true));
    }

    @Test
    void modifierUnBrouillon_nePublieAucunEvenement() {
        service.modifier(distributionId, requete("Distribution", date.plusDays(1), 12, LocalTime.of(17, 0)));

        verify(eventPublisher, never()).publierModifiee(any(), anyBoolean(), anyBoolean());
        verify(verrou).verrouiller(distributionId);
    }

    private UpdateDistributionRequest requete(String titre, LocalDate jour, int capacite, LocalTime debut) {
        return new UpdateDistributionRequest(titre, null, null, jour, capacite, 5, "CRENEAU_UNIQUE",
            List.of(new CreneauModifieRequest(creneau.getId(), debut, LocalTime.of(19, 0), 10)));
    }
}
