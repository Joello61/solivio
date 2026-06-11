package com.solivio.api.identity.infrastructure.web;

import com.solivio.api.identity.application.AuthService;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.GoogleCompleteRegistrationRequest;
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
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.io.IOException;

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
            @CookieValue(name = "refresh_token", required = false) String cookieToken,
            @RequestBody(required = false) RefreshTokenRequest bodyRequest,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        // Priorite au cookie HttpOnly (web BFF). Fallback sur body JSON (mobile/API).
        String tokenBrut = cookieToken != null ? cookieToken
            : (bodyRequest != null ? bodyRequest.refreshToken() : null);
        if (tokenBrut == null || tokenBrut.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        TokenResponse token = authService.refreshToken(tokenBrut, httpRequest, httpResponse);
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

    /**
     * Point d'entree mobile pour le login Google.
     * Pose un cookie de marquage puis redirige vers le flux OAuth2 Spring Security.
     * Le GoogleOAuth2SuccessHandler detecte ce cookie et redirige vers le scheme de l'app
     * plutot que vers le frontend web.
     */
    @GetMapping("/google/mobile-init")
    public void googleMobileInit(HttpServletResponse httpResponse) throws IOException {
        httpResponse.addHeader("Set-Cookie",
            "solivio_mobile_auth=1; Max-Age=300; Path=/; SameSite=Lax; HttpOnly");
        httpResponse.sendRedirect("/oauth2/authorization/google");
    }

    /**
     * Point d'entree mobile pour lier un compte Google a un compte email/mot de passe existant.
     * Apres le flux OAuth2, GoogleOAuth2SuccessHandler detecte ce cookie et retourne
     * soliviomobile://auth?linked=true sans generer de nouveaux tokens.
     */
    @GetMapping("/google/link-mobile-init")
    public void googleLinkMobileInit(HttpServletResponse httpResponse) throws IOException {
        httpResponse.addHeader("Set-Cookie",
            "solivio_mobile_link=1; Max-Age=300; Path=/; SameSite=Lax; HttpOnly");
        httpResponse.sendRedirect("/oauth2/authorization/google");
    }

    /**
     * Finalise l'inscription d'un compte Google : lie le compte a une association.
     * Accessible sans authentification - la legitimite est verifiee par la presence du google_id.
     */
    @PostMapping("/google/complete-registration")
    public ResponseEntity<TokenResponse> googleCompleteRegistration(
            @Valid @RequestBody GoogleCompleteRegistrationRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        TokenResponse token = authService.completerInscriptionGoogle(
            request.email(), request.nom(), request.prenom(),
            request.codeAssociation(), request.tokenInvitation(),
            httpRequest, httpResponse);
        return ResponseEntity.ok(token);
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
