package com.solivio.api.distribution.infrastructure.web;

import com.solivio.api.distribution.application.DistributionService;
import com.solivio.api.distribution.infrastructure.web.dto.DistributionPubliqueResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

/**
 * Prochaines distributions pour la page d'accueil publique, sans authentification.
 * Debit limite par adresse IP (SecurityConfig) et reponse mise en cache.
 */
@RestController
@RequestMapping("/api/public/distributions")
public class DistributionPubliqueController {

    private static final Duration DUREE_CACHE = Duration.ofMinutes(5);

    private final DistributionService distributionService;

    public DistributionPubliqueController(DistributionService distributionService) {
        this.distributionService = distributionService;
    }

    @GetMapping("/prochaines")
    public ResponseEntity<List<DistributionPubliqueResponse>> prochaines() {
        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(DUREE_CACHE).cachePublic())
            .body(distributionService.prochainesPubliques());
    }
}
