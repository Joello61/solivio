package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.shared.distribution.DistributionQueryPort;
import com.solivio.api.shared.engagement.EngagementsAVenirPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Une inscription confirmee ou en liste d'attente engage la personne tant que la
 * distribution n'est ni terminee ni annulee.
 */
@Service
@Transactional(readOnly = true)
public class EngagementsInscriptionAdapter implements EngagementsAVenirPort {

    private static final List<StatutInscription> ACTIVES =
        List.of(StatutInscription.CONFIRMEE, StatutInscription.LISTE_ATTENTE);
    private static final Set<String> CLOSES = Set.of("TERMINEE", "ANNULEE");

    private final InscriptionRepository inscriptionRepository;
    private final DistributionQueryPort distributionQueryPort;

    public EngagementsInscriptionAdapter(InscriptionRepository inscriptionRepository,
                                         DistributionQueryPort distributionQueryPort) {
        this.inscriptionRepository = inscriptionRepository;
        this.distributionQueryPort = distributionQueryPort;
    }

    @Override
    public boolean aDesEngagementsAVenir(UUID personneId) {
        List<UUID> distributions = inscriptionRepository.trouverDistributionsDesInscriptions(personneId, ACTIVES);
        return !distributions.isEmpty() && distributionQueryPort.trouverDetailsParIds(distributions).stream()
            .anyMatch(d -> !CLOSES.contains(d.statut()));
    }
}
