package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.PasswordService;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.ChangePasswordRequest;
import com.solivio.api.identity.infrastructure.web.dto.ForgotPasswordRequest;
import com.solivio.api.identity.infrastructure.web.dto.ResetPasswordRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class PasswordController {

    private final PasswordService passwordService;

    public PasswordController(PasswordService passwordService) {
        this.passwordService = passwordService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordService.demanderReset(request.email());
        // Reponse identique que le compte existe ou non (anti-enumeration)
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordService.resetMotDePasse(request.email(), request.code(), request.nouveauMotDePasse());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal SolivioUserDetails userDetails) {
        passwordService.changerMotDePasse(
            userDetails, request.motDePasseActuel(), request.nouveauMotDePasse());
        return ResponseEntity.noContent().build();
    }
}
