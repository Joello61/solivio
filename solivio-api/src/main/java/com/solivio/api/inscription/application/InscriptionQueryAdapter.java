package com.solivio.api.inscription.application;

import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class InscriptionQueryAdapter implements InscriptionQueryPort {

    private final InscriptionRepository inscriptionRepository;

    public InscriptionQueryAdapter(InscriptionRepository inscriptionRepository) {
        this.inscriptionRepository = inscriptionRepository;
    }

    @Override
    public int compterBeneficiairesInscrits(UUID distributionId) {
        return (int) inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE
        );
    }

    @Override
    public int compterBeneficiairesPresents(UUID distributionId) {
        return (int) inscriptionRepository.compterBeneficiairesPresents(distributionId);
    }
}
