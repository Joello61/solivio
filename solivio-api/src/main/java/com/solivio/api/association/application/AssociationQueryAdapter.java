package com.solivio.api.association.application;

import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.shared.association.AssociationQueryPort;
import org.springframework.stereotype.Component;

@Component
public class AssociationQueryAdapter implements AssociationQueryPort {

    private final AssociationRepository associationRepository;

    public AssociationQueryAdapter(AssociationRepository associationRepository) {
        this.associationRepository = associationRepository;
    }

    @Override
    public Integer frequenceMaxParSemaine(String tenantSlug) {
        return associationRepository.findBySlug(tenantSlug)
            .map(a -> a.getFrequenceMaxParSemaine())
            .orElse(null);
    }
}
