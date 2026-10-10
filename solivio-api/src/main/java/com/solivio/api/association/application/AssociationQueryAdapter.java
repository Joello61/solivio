package com.solivio.api.association.application;

import com.solivio.api.shared.association.AssociationQueryPort;
import com.solivio.api.shared.temps.HorlogeAssociation;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.ZoneId;
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

    @Override
    public ZoneId fuseauHoraire() {
        try {
            return ZoneId.of(configService.charger().getFuseauHoraire());
        } catch (DateTimeException e) {
            return HorlogeAssociation.ZONE_PAR_DEFAUT;
        }
    }
}
