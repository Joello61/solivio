package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.RegisterService;
import com.solivio.api.identity.infrastructure.web.dto.RegisterRequest;
import com.solivio.api.identity.infrastructure.web.dto.ResendVerificationRequest;
import com.solivio.api.identity.infrastructure.web.dto.VerifyEmailRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class RegisterController {

    private final RegisterService registerService;

    public RegisterController(RegisterService registerService) {
        this.registerService = registerService;
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        if (request.tokenInvitation() != null && !request.tokenInvitation().isBlank()) {
            registerService.inscrireViaInvitation(
                request.email(), request.motDePasse(), request.nom(), request.prenom(),
                UUID.fromString(request.tokenInvitation()));
        } else {
            registerService.inscrireBeneficiaire(
                request.email(), request.motDePasse(), request.nom(), request.prenom());
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        registerService.verifierEmail(request.email(), request.code());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        registerService.renvoyerVerification(request.email());
        return ResponseEntity.noContent().build();
    }
}
