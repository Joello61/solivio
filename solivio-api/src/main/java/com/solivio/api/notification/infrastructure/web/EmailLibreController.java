package com.solivio.api.notification.infrastructure.web;

import com.solivio.api.notification.application.EmailLibreService;
import com.solivio.api.notification.infrastructure.web.dto.EmailLibreRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("hasAnyRole('RESPONSABLE', 'SUPER_ADMIN')")
public class EmailLibreController {

    private final EmailLibreService emailLibreService;

    public EmailLibreController(EmailLibreService emailLibreService) {
        this.emailLibreService = emailLibreService;
    }

    @PostMapping("/email-libre")
    public ResponseEntity<Void> envoyerEmailLibre(@Valid @RequestBody EmailLibreRequest request) {
        emailLibreService.envoyer(request.cible(), request.sujet(), request.corps());
        return ResponseEntity.ok().build();
    }
}
