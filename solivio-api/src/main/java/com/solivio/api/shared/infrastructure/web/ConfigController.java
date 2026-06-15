package com.solivio.api.shared.infrastructure.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/config")
public class ConfigController {

    @Value("${solivio.maps.api-key:}")
    private String mapsApiKey;

    @GetMapping
    public ResponseEntity<ConfigResponse> config() {
        return ResponseEntity.ok(new ConfigResponse(mapsApiKey));
    }

    public record ConfigResponse(String googleMapsApiKey) {}
}
