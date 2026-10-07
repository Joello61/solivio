package com.solivio.api.association.application;

import com.solivio.api.shared.association.AssociationQueryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@Transactional(readOnly = true)
public class AssociationQueryAdapter implements AssociationQueryPort {

    private final AssociationConfigService configService;

    public AssociationQueryAdapter(AssociationConfigService configService) {
        this.configService = configService;
    }

    @Override
    public Integer frequenceMaxParSemaine() {
        return configService.charger().getFrequenceMaxParSemaine();
    }

    @Override
    public Optional<String> trouverContactEmail() {
        return Optional.ofNullable(configService.charger().getContactEmail());
    }

    @Override
    public String nomAssociation() {
        return configService.charger().getNom();
    }
}
