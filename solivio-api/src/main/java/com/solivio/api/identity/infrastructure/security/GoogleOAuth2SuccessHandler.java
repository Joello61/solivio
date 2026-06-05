package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Apres un login Google reussi :
 * - Si le compte a 1 seul tenant actif : emet un JWT et redirige vers le dashboard.
 * - Si le compte a plusieurs tenants : redirige vers /tenant-select.
 * - Si le compte n'a aucun tenant (nouveau compte Google) : redirige vers /register/association
 *   pour que l'utilisateur saisisse son code association.
 */
@Component
public class GoogleOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final CompteRepository compteRepository;
    private final MembreAssociationRepository membreRepo;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepo;
    private final String frontendUrl;

    public GoogleOAuth2SuccessHandler(
            CompteRepository compteRepository,
            MembreAssociationRepository membreRepo,
            JwtService jwtService,
            RefreshTokenRepository refreshTokenRepo,
            @Value("${solivio.auth.post-login-redirect-uri}") String frontendUrl) {
        this.compteRepository = compteRepository;
        this.membreRepo = membreRepo;
        this.jwtService = jwtService;
        this.refreshTokenRepo = refreshTokenRepo;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        Compte compte = compteRepository.findByEmail(email).orElseThrow();
        List<MembreAssociation> affiliations = membreRepo.findActivesByCompteId(compte.getId());

        if (affiliations.isEmpty()) {
            // Nouveau compte Google sans association : redirige vers la page de saisie du code
            String redirectUrl = frontendUrl + "/register/association?google=true&email="
                + URLEncoder.encode(email, StandardCharsets.UTF_8);
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            return;
        }

        String tenantSlug = affiliations.size() == 1 ? affiliations.get(0).getAssociation().getSlug() : null;
        String role = affiliations.size() == 1 ? affiliations.get(0).getRole() : null;
        String coordoType = affiliations.size() == 1 ? affiliations.get(0).getCoordoType() : null;

        String accessToken = jwtService.genererAccessToken(
            compte.getId(), compte.getEmail(), compte.getNom(), compte.getPrenom(),
            tenantSlug, role != null ? List.of(role) : List.of(),
            coordoType, compte.isSuperAdmin()
        );

        // Token inclus dans l'URL de redirection (fragment hash, non loggue par le serveur)
        // Le frontend lit le fragment, le stocke en memoire et l'utilise pour les appels API.
        String redirectUrl;
        if (affiliations.size() == 1) {
            redirectUrl = frontendUrl + "/dashboard#token=" + accessToken;
        } else {
            redirectUrl = frontendUrl + "/tenant-select#token=" + accessToken;
        }

        emetRefreshTokenCookie(compte, tenantSlug, request, response);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private void emetRefreshTokenCookie(Compte compte, String tenantSlug,
                                        HttpServletRequest request, HttpServletResponse response) {
        String tokenBrut = jwtService.genererRefreshTokenBrut();
        String hash = jwtService.hasher(tokenBrut);
        var rt = new com.solivio.api.identity.domain.RefreshToken(
            compte, hash, tenantSlug,
            request.getHeader("User-Agent"),
            request.getRemoteAddr(),
            jwtService.refreshTokenExpiration()
        );
        refreshTokenRepo.save(rt);
        response.addHeader("Set-Cookie",
            "refresh_token=" + tokenBrut
                + "; Max-Age=" + jwtService.getRefreshTokenSeconds()
                + "; Path=/api/auth/refresh"
                + "; HttpOnly"
                + (request.isSecure() ? "; Secure" : "")
                + "; SameSite=Strict");
    }
}
