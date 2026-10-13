package com.solivio.api.shared.association;

import java.time.ZoneId;
import java.util.Optional;

public interface AssociationQueryPort {

    /**
     * Retourne la frequence max d'inscription par semaine pour l'association.
     * Null signifie pas de limite.
     */
    Integer frequenceMaxParSemaine();

    Optional<String> trouverContactEmail();

    String nomAssociation();

    /** Fuseau configure par l'association, ou Europe/Paris s'il est invalide. */
    ZoneId fuseauHoraire();
}
