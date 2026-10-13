package com.solivio.api.shared.temps;

import com.solivio.api.shared.association.AssociationQueryPort;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * "Aujourd'hui" pour les regles metier (demarrage, desistement tardif, dates
 * passees). Sans fuseau, LocalDate.now() suit celui du conteneur, en UTC : entre
 * minuit et 2h a Paris, on etait encore la veille.
 */
@Component
public class HorlogeAssociation {

    /** Fuseau de reference des taches planifiees, dont le cron ne peut pas suivre la configuration. */
    public static final String FUSEAU_PAR_DEFAUT = "Europe/Paris";
    public static final ZoneId ZONE_PAR_DEFAUT = ZoneId.of(FUSEAU_PAR_DEFAUT);

    private final Clock clock;
    private final AssociationQueryPort associationQueryPort;

    public HorlogeAssociation(Clock clock, AssociationQueryPort associationQueryPort) {
        this.clock = clock;
        this.associationQueryPort = associationQueryPort;
    }

    public LocalDate aujourdhui() {
        return LocalDate.now(clock.withZone(associationQueryPort.fuseauHoraire()));
    }
}
