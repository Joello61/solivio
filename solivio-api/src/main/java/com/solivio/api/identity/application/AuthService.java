package com.solivio.api.identity.application;

import com.solivio.api.association.infrastructure.persistence.AssociationRepository;
import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.RefreshToken;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.identity.infrastructure.security.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.MeResponse;
import com.solivio.api.identity.infrastructure.web.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Orchestration du login, logout, refresh token et switch-tenant.
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final CompteRepository compteRepository;
    private final MembreAssociationRepository membreRepo;
    private final RefreshTokenRepository refreshTokenRepo;
    private final JwtService jwtService;
    private final AssociationRepository associationRepository;

    public AuthService(
            AuthenticationManager authenticationManager,
            CompteRepository compteRepository,
            MembreAssociationRepository membreRepo,
            RefreshTokenRepository refreshTokenRepo,
            JwtService jwtService,
            AssociationRepository associationRepository) {
        this.authenticationManager = authenticationManager;
        this.compteRepository = compteRepository;
        this.membreRepo = membreRepo;
        this.refreshTokenRepo = refreshTokenRepo;
        this.jwtService = jwtService;
        this.associationRepository = associationRepository;
    }

    @Transactional
    public TokenResponse login(String email, String motDePasse, boolean rememberMe,
                               HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, motDePasse));

        Compte compte = compteRepository.findByEmail(email)
            .orElseThrow(() -> new AuthenticationException("Compte introuvable") {});

        List<MembreAssociation> affiliations = membreRepo.findActivesByCompteId(compte.getId());
        List<TokenResponse.TenantSummary> tenants = affiliations.stream()
            .map(a -> new TokenResponse.TenantSummary(
                a.getAssociation().getSlug(),
                a.getAssociation().getNom(),
                a.getRole(),
                a.getCoordoType()
            ))
            .toList();

        // Si l'utilisateur appartient a un seul tenant, on emet directement un JWT pour ce tenant.
        // Sinon, on emet un JWT sans tenant (le frontend devra appeler /switch-tenant).
        String tenantSlug = affiliations.size() == 1 ? affiliations.get(0).getAssociation().getSlug() : null;
        String role = affiliations.size() == 1 ? affiliations.get(0).getRole() : null;
        String coordoType = affiliations.size() == 1 ? affiliations.get(0).getCoordoType() : null;

        String accessToken = jwtService.genererAccessToken(
            compte.getId(), compte.getEmail(), compte.getNom(), compte.getPrenom(),
            tenantSlug, role != null ? List.of(role) : List.of(),
            coordoType, compte.isSuperAdmin()
        );

        emetAccessTokenCookie(accessToken, request, response);
        emetRefreshTokenCookie(compte, tenantSlug, request, response, rememberMe, rememberMe);

        return TokenResponse.of(accessToken, jwtService.getAccessTokenMinutes() * 60, tenants);
    }

    @Transactional
    public TokenResponse switchTenant(SolivioUserDetails userDetails, String tenantSlug,
                                      HttpServletRequest request, HttpServletResponse response) {
        Compte compte = compteRepository.findById(userDetails.getCompteId())
            .orElseThrow();

        MembreAssociation membre = membreRepo
            .findByCompteIdAndAssociationId(
                compte.getId(),
                associationRepository.findBySlug(tenantSlug)
                    .orElseThrow(() -> new IllegalArgumentException("Association inconnue : " + tenantSlug))
                    .getId()
            )
            .filter(MembreAssociation::estActive)
            .orElseThrow(() -> new IllegalArgumentException("Acces refuse au tenant : " + tenantSlug));

        String accessToken = jwtService.genererAccessToken(
            compte.getId(), compte.getEmail(), compte.getNom(), compte.getPrenom(),
            tenantSlug, List.of(membre.getRole()),
            membre.getCoordoType(), compte.isSuperAdmin()
        );

        emetAccessTokenCookie(accessToken, request, response);
        emetRefreshTokenCookie(compte, tenantSlug, request, response, false, false);

        return TokenResponse.of(accessToken, jwtService.getAccessTokenMinutes() * 60, List.of());
    }

    /**
     * Extrait le refresh token depuis le cookie HttpOnly (web) ou depuis un token brut passe en parametre (mobile).
     * La priorite va au cookie.
     */
    public Optional<String> extraireRefreshTokenDepuisCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
            .filter(c -> "refresh_token".equals(c.getName()))
            .map(jakarta.servlet.http.Cookie::getValue)
            .findFirst();
    }

    @Transactional
    public TokenResponse refreshToken(String refreshTokenBrut,
                                      HttpServletRequest request, HttpServletResponse response) {
        String hash = jwtService.hasher(refreshTokenBrut);
        RefreshToken token = refreshTokenRepo.findByTokenHash(hash)
            .orElseThrow(() -> new IllegalArgumentException("Refresh token invalide"));

        if (token.isRevoque() || token.estExpire()) {
            if (token.isRevoque()) {
                refreshTokenRepo.revoquerTousParCompte(token.getCompte().getId());
            }
            throw new IllegalArgumentException("Refresh token expire ou revoque");
        }

        // Rotation : on revoque l'ancien et on emet un nouveau
        boolean longDuree = token.isLongDuree();
        token.setRevoque(true);
        refreshTokenRepo.save(token);

        Compte compte = token.getCompte();
        String tenantSlug = token.getTenantSlug();

        List<MembreAssociation> affiliations = membreRepo.findActivesByCompteId(compte.getId());
        // findFirst() appelle Optional.of() qui refuse les null : on recherche l'entite
        // d'abord, puis on lit les champs (coordoType peut legitimement etre null).
        Optional<MembreAssociation> membreOpt = affiliations.stream()
            .filter(a -> tenantSlug != null && tenantSlug.equals(a.getAssociation().getSlug()))
            .findFirst();
        String role = membreOpt.map(MembreAssociation::getRole).orElse(null);
        String coordoType = membreOpt.map(MembreAssociation::getCoordoType).orElse(null);

        String accessToken = jwtService.genererAccessToken(
            compte.getId(), compte.getEmail(), compte.getNom(), compte.getPrenom(),
            tenantSlug, role != null ? List.of(role) : List.of(),
            coordoType, compte.isSuperAdmin()
        );

        emetAccessTokenCookie(accessToken, request, response);
        // Propage la preference longDuree du token initial (rememberMe)
        emetRefreshTokenCookie(compte, tenantSlug, request, response, longDuree, longDuree);

        return TokenResponse.of(accessToken, jwtService.getAccessTokenMinutes() * 60, List.of());
    }

    @Transactional
    public void logout(SolivioUserDetails userDetails, HttpServletRequest request,
                       HttpServletResponse response) {
        // Revoque tous les refresh tokens du compte
        refreshTokenRepo.revoquerTousParCompte(userDetails.getCompteId());
        supprimerCookies(response);
    }

    public MeResponse me(SolivioUserDetails userDetails) {
        Compte compte = compteRepository.findById(userDetails.getCompteId())
            .orElseThrow();
        List<String> roles = userDetails.getAuthorities().stream()
            .map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
            .toList();
        return new MeResponse(
            compte.getId().toString(),
            compte.getEmail(),
            compte.getNom(),
            compte.getPrenom(),
            compte.isSuperAdmin(),
            userDetails.getTenantSlug(),
            roles
        );
    }

    private void emetAccessTokenCookie(String accessToken,
                                        HttpServletRequest request, HttpServletResponse response) {
        response.addHeader("Set-Cookie",
            "access_token=" + accessToken
                + "; Max-Age=" + (jwtService.getAccessTokenMinutes() * 60)
                + "; Path=/"
                + "; HttpOnly"
                + (request.isSecure() ? "; Secure" : "")
                + "; SameSite=Strict");
    }

    private void emetRefreshTokenCookie(Compte compte, String tenantSlug,
                                        HttpServletRequest request, HttpServletResponse response,
                                        boolean longDuree, boolean storerLongDuree) {
        String tokenBrut = jwtService.genererRefreshTokenBrut();
        String hash = jwtService.hasher(tokenBrut);

        RefreshToken rt = new RefreshToken(
            compte, hash, tenantSlug,
            request.getHeader("User-Agent"),
            request.getRemoteAddr(),
            jwtService.refreshTokenExpiration(),
            storerLongDuree
        );
        refreshTokenRepo.save(rt);

        // Header Set-Cookie manuel : l'API Cookie Jakarta ne supporte pas SameSite.
        // Max-Age=-1 : cookie de session (expire a la fermeture du navigateur).
        response.addHeader("Set-Cookie",
            "refresh_token=" + tokenBrut
                + "; Max-Age=" + (longDuree ? jwtService.getRefreshTokenSeconds() : -1)
                + "; Path=/api/auth/refresh"
                + "; HttpOnly"
                + (request.isSecure() ? "; Secure" : "")
                + "; SameSite=Strict");
    }

    private void supprimerCookies(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
            "refresh_token=; Max-Age=0; Path=/api/auth/refresh; HttpOnly; SameSite=Strict");
        response.addHeader("Set-Cookie",
            "access_token=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict");
    }
}
