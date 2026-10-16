package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.identity.application.PersonneProvisioningService;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.RefreshToken;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;

/**
 * Apres un login Google reussi :
 * - Web : emet un JWT et redirige vers le dashboard.
 * - Mobile (cookie solivio_mobile_auth=1) : inclut accessToken + refreshToken dans le
 *   deep link soliviomobile://auth?accessToken=...&refreshToken=....
 * - Nouveau compte sans role : redirige vers la finalisation de l'inscription.
 * - Membre suspendu : redirige vers la connexion avec une erreur.
 */
@Component
public class GoogleOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final CompteRepository compteRepository;
    private final MembreAssociationRepository membreRepo;
    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepo;
    private final PersonneProvisioningService personneProvisioningService;
    private final String frontendUrl;

    public GoogleOAuth2SuccessHandler(
            CompteRepository compteRepository,
            MembreAssociationRepository membreRepo,
            JwtService jwtService,
            RefreshTokenRepository refreshTokenRepo,
            PersonneProvisioningService personneProvisioningService,
            @Value("${solivio.auth.post-login-redirect-uri}") String frontendUrl) {
        this.compteRepository = compteRepository;
        this.membreRepo = membreRepo;
        this.jwtService = jwtService;
        this.refreshTokenRepo = refreshTokenRepo;
        this.personneProvisioningService = personneProvisioningService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        assert
            oAuth2User != null;
        String email = oAuth2User.getAttribute("email");

        Compte compte = compteRepository.findByEmail(email).orElseThrow();
        Optional<MembreAssociation> membre = membreRepo.findByCompteId(compte.getId());

        boolean mobileAuth = detecteMobileAuth(request, response);
        boolean mobileLinkAuth = !mobileAuth && detecteMobileLinkAuth(request, response);

        if (mobileLinkAuth) {
            getRedirectStrategy().sendRedirect(request, response, "soliviomobile://auth?linked=true");
            return;
        }

        if (membre.isEmpty()) {
            assert
                email != null;
            String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
            String encodedNom = URLEncoder.encode(
                compte.getNom() != null ? compte.getNom() : "", StandardCharsets.UTF_8);
            String encodedPrenom = URLEncoder.encode(
                compte.getPrenom() != null ? compte.getPrenom() : "", StandardCharsets.UTF_8);
            String redirectUrl = mobileAuth
                ? "soliviomobile://auth?type=new_user"
                    + "&email=" + encodedEmail
                    + "&nom=" + encodedNom
                    + "&prenom=" + encodedPrenom
                : frontendUrl + "/complete-google-registration?email=" + encodedEmail
                    + "&nom=" + encodedNom
                    + "&prenom=" + encodedPrenom;
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            return;
        }

        if (!membre.get().estActive()) {
            getRedirectStrategy().sendRedirect(request, response,
                mobileAuth ? "soliviomobile://auth?error=compte_suspendu"
                    : frontendUrl + "/login?erreur=compte-suspendu");
            return;
        }

        String accessToken = jwtService.genererAccessToken(
            compte.getId(), compte.getEmail(), compte.getNom(), compte.getPrenom(),
            membre.get().rolesTries(), membre.get().getCoordoType(), compte.isSuperAdmin()
        );

        // JIT : couvre les comptes Google anterieurs a la creation systematique de la Personne.
        personneProvisioningService.provisionner(compte.getEmail(), compte.getNom(), compte.getPrenom());

        if (mobileAuth) {
            String refreshTokenBrut = genererRefreshTokenMobile(compte, request);
            String redirectUrl = "soliviomobile://auth?accessToken=" + accessToken
                + "&refreshToken=" + URLEncoder.encode(refreshTokenBrut, StandardCharsets.UTF_8);
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            return;
        }

        emetRefreshTokenCookie(compte, request, response);
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/dashboard#token=" + accessToken);
    }

    /**
     * Detecte si la requete vient de l'app mobile via le cookie solivio_mobile_auth.
     * Efface le cookie apres detection pour eviter toute reutilisation.
     */
    private boolean detecteMobileAuth(HttpServletRequest request, HttpServletResponse response) {
        if (request.getCookies() == null) {
            return false;
        }
        boolean mobile = Arrays.stream(request.getCookies())
            .anyMatch(c -> "solivio_mobile_auth".equals(c.getName()) && "1".equals(c.getValue()));
        if (mobile) {
            response.addHeader("Set-Cookie",
                "solivio_mobile_auth=; Max-Age=0; Path=/; SameSite=Lax; HttpOnly");
        }
        return mobile;
    }

    private boolean detecteMobileLinkAuth(HttpServletRequest request, HttpServletResponse response) {
        if (request.getCookies() == null) {
            return false;
        }
        boolean link = Arrays.stream(request.getCookies())
            .anyMatch(c -> "solivio_mobile_link".equals(c.getName()) && "1".equals(c.getValue()));
        if (link) {
            response.addHeader("Set-Cookie",
                "solivio_mobile_link=; Max-Age=0; Path=/; SameSite=Lax; HttpOnly");
        }
        return link;
    }

    private String genererRefreshTokenMobile(Compte compte,
                                             HttpServletRequest request) {
        String tokenBrut = jwtService.genererRefreshTokenBrut();
        String hash = jwtService.hasher(tokenBrut);
        var rt = new RefreshToken(
            compte, hash,
            request.getHeader("User-Agent"),
            request.getRemoteAddr(),
            jwtService.refreshTokenExpiration(),
            true
        );
        refreshTokenRepo.save(rt);
        return tokenBrut;
    }

    private void emetRefreshTokenCookie(Compte compte,
                                        HttpServletRequest request, HttpServletResponse response) {
        String tokenBrut = jwtService.genererRefreshTokenBrut();
        String hash = jwtService.hasher(tokenBrut);
        var rt = new RefreshToken(
            compte, hash,
            request.getHeader("User-Agent"),
            request.getRemoteAddr(),
            jwtService.refreshTokenExpiration(),
            true
        );
        refreshTokenRepo.save(rt);
        // Memes attributs que la connexion par mot de passe (AuthService) : le
        // chemin "/" permet au proxy Next.js de rafraichir la session cote serveur.
        ResponseCookie cookie = ResponseCookie.from("refresh_token", tokenBrut)
            .maxAge(jwtService.getRefreshTokenSeconds())
            .path("/")
            .httpOnly(true)
            .secure(request.isSecure())
            .sameSite("Strict")
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }
}
