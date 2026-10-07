package com.solivio.api.association.infrastructure.web;

import com.solivio.api.association.application.AssociationLogoService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class LogoPublicController {

    private final AssociationLogoService logoService;

    public LogoPublicController(AssociationLogoService logoService) {
        this.logoService = logoService;
    }

    @GetMapping("/logo")
    public ResponseEntity<byte[]> servirLogo() {
        byte[] data = logoService.lireLogo();
        if (data.length == 0) {
            return ResponseEntity.notFound().build();
        }
        MediaType mediaType = logoService.mediaTypeLogo();
        return ResponseEntity.ok()
            .contentType(mediaType)
            .header("Cache-Control", "public, max-age=86400")
            .body(data);
    }
}
