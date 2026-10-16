package com.solivio.api.shared.engagement;

import java.util.UUID;

/**
 * Engagements d'une personne qui ne sont pas encore passes (inscription, participation,
 * mission prise). Chaque module repond pour les siens ; identity les consulte avant de
 * nommer une personne responsable, role qui ne se cumule avec aucun autre (ADR-012).
 */
public interface EngagementsAVenirPort {

    boolean aDesEngagementsAVenir(UUID personneId);
}
