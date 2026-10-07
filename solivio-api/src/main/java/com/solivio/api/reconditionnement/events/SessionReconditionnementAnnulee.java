package com.solivio.api.reconditionnement.events;

import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * Une session de reconditionnement publiee est annulee.
 */
public record SessionReconditionnementAnnulee(UUID sessionId, ZonedDateTime dateHeureDebut) {}
