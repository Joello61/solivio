package com.solivio.api.inscription.events;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Les absences d'une distribution terminee sont enregistrees (RG4) : les beneficiaires
 * confirmes non pointes sont absents. Les statistiques se calculent sur cet etat final.
 */
public record AbsencesEnregistrees(UUID distributionId, LocalDate date) {}
