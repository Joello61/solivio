package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.AuthService;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.LoginRequest;
import com.solivio.api.identity.infrastructure.web.dto.MeResponse;
import com.solivio.api.identity.infrastructure.web.dto.RefreshTokenRequest;
import com.solivio.api.identity.infrastructure.web.dto.SwitchTenantRequest;
import com.solivio.api.identity.infrastructure.web.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        TokenResponse token = authService.login(
            request.email(), request.motDePasse(), request.rememberMe(),
            httpRequest, httpResponse);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        TokenResponse token = authService.refreshToken(
            request.refreshToken(), httpRequest, httpResponse);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal SolivioUserDetails userDetails,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        authService.logout(userDetails, httpRequest, httpResponse);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> me(
            @AuthenticationPrincipal SolivioUserDetails userDetails) {
        return ResponseEntity.ok(authService.me(userDetails));
    }

    @PostMapping("/switch-tenant")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TokenResponse> switchTenant(
            @Valid @RequestBody SwitchTenantRequest request,
            @AuthenticationPrincipal SolivioUserDetails userDetails,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        TokenResponse token = authService.switchTenant(
            userDetails, request.tenantSlug(), httpRequest, httpResponse);
        return ResponseEntity.ok(token);
    }
}
