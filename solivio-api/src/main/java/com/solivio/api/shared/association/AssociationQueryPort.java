package com.solivio.api.shared.association;

import java.util.Optional;

public interface AssociationQueryPort {

    /**
     * Retourne la frequence max d'inscription par semaine pour l'association.
     * Null signifie pas de limite.
     */
    Integer frequenceMaxParSemaine(String tenantSlug);

    Optional<String> trouverContactEmail(String tenantSlug);
}
