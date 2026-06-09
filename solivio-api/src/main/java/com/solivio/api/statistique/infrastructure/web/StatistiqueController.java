package com.solivio.api.statistique.infrastructure.web;

import com.solivio.api.statistique.application.StatistiqueService;
import com.solivio.api.statistique.infrastructure.web.dto.StatistiqueDistributionResponse;
import com.solivio.api.statistique.infrastructure.web.dto.StatistiquePeriodeResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/statistiques")
@PreAuthorize("hasAnyRole('RESPONSABLE','COORDINATEUR','SUPER_ADMIN')")
public class StatistiqueController {

    private final StatistiqueService statistiqueService;

    public StatistiqueController(StatistiqueService statistiqueService) {
        this.statistiqueService = statistiqueService;
    }

    @GetMapping("/distributions/{id}")
    public ResponseEntity<StatistiqueDistributionResponse> parDistribution(@PathVariable UUID id) {
        return statistiqueService.trouverParDistribution(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/distributions")
    public ResponseEntity<List<StatistiqueDistributionResponse>> listeParPeriode(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin
    ) {
        return ResponseEntity.ok(statistiqueService.listerParPeriode(debut, fin));
    }

    @GetMapping("/periode")
    public ResponseEntity<StatistiquePeriodeResponse> agregationPeriode(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin
    ) {
        return ResponseEntity.ok(statistiqueService.aggregerPeriode(debut, fin));
    }

    @PostMapping("/distributions/{id}/recalculer")
    @PreAuthorize("hasAnyRole('RESPONSABLE','SUPER_ADMIN')")
    public ResponseEntity<StatistiqueDistributionResponse> recalculer(@PathVariable UUID id) {
        return statistiqueService.trouverParDistribution(id)
            .map(existing -> {
                statistiqueService.calculerEtSauvegarder(id, existing.distributionDate());
                return ResponseEntity.ok(statistiqueService.trouverParDistribution(id).orElseThrow());
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
