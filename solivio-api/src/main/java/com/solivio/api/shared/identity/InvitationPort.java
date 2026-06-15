package com.solivio.api.shared.identity;

import java.util.UUID;

/**
 * Port pour envoyer une invitation a rejoindre l'association.
 * Isole le module inscription des details d'implementation du module identity.
 */
public interface InvitationPort {

    void inviterBenevole(String emailInvite, UUID compteIdInvitant, String tenantSlug);
}
