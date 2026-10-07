package com.solivio.api.notification.infrastructure.evenements;

import java.util.UUID;

/**
 * Demande d'envoi du rappel de la veille pour une distribution. Interne au
 * module : publie par le job planifie, traite par RappelVeilleListener.
 */
public record RappelVeille(UUID distributionId) {}
