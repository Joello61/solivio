package com.solivio.api.statistique.infrastructure.evenements;

import com.solivio.api.inscription.events.AbsencesEnregistrees;
import com.solivio.api.statistique.application.StatistiqueService;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

/**
 * Calcule et enregistre les statistiques d'une distribution a sa cloture, une fois
 * les absences enregistrees par le module inscription (RG4).
 */
@Component
public class StatistiqueListener {

    private final StatistiqueService statistiqueService;

    public StatistiqueListener(StatistiqueService statistiqueService) {
        this.statistiqueService = statistiqueService;
    }

    @ApplicationModuleListener
    void on(AbsencesEnregistrees event) {
        statistiqueService.calculerEtSauvegarder(event.distributionId(), event.date());
    }
}
