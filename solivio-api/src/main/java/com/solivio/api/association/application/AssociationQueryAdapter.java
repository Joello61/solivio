package com.solivio.api.association.application;

import com.solivio.api.association.domain.Association;
import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.shared.association.AssociationQueryPort;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AssociationQueryAdapter implements AssociationQueryPort {

    private final AssociationRepository associationRepository;

    public AssociationQueryAdapter(AssociationRepository associationRepository) {
        this.associationRepository = associationRepository;
    }

    @Override
    public Integer frequenceMaxParSemaine(String tenantSlug) {
        return associationRepository.findBySlug(tenantSlug)
            .map(Association::getFrequenceMaxParSemaine)
            .orElse(null);
    }

    @Override
    public Optional<String> trouverContactEmail(String tenantSlug) {
        return associationRepository.findBySlug(tenantSlug)
            .map(Association::getContactEmail);
    }
}
