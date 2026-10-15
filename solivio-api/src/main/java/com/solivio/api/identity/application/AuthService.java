package com.solivio.api.identity.application;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.MembreAssociation;
import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.domain.RefreshToken;
import com.solivio.api.identity.infrastructure.persistence.CompteRepository;
import com.solivio.api.identity.infrastructure.persistence.MembreAssociationRepository;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.identity.infrastructure.persistence.RefreshTokenRepository;
import com.solivio.api.identity.infrastructure.security.JwtService;
import com.solivio.api.identity.SolivioUserDetails;
import com.solivio.api.identity.infrastructure.web.dto.MeResponse;
import com.solivio.api.identity.infrastructure.web.dto.TokenResponse;
import com.solivio.api.shared.exception.EmailNonVerifieException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Orchestration du login, logout et refresh token.
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final CompteRepository compteRepository;
    private final MembreAssociationRepository membreRepo;
    private final RefreshTokenRepository refreshTokenRepo;
    private final JwtService jwtService;
    private final PersonneProvisioningService personneProvisioningService;
    private final PersonneRepository personneRepository;
    private final RegisterService registerService;
    private final TentativesConnexionService tentativesConnexion;

    public AuthService(
            AuthenticationManager authenticationManager,
            CompteRepository compteRepository,
            MembreAssociationRepository membreRepo,
            RefreshTokenRepository refreshTokenRepo,
            JwtService jwtService,
            PersonneProvisioningService personneProvisioningService,
            PersonneRepository personneRepository,
            RegisterService registerService,
            TentativesConnexionService tentativesConnexion) {
        this.authenticationManager = authenticationManager;
        this.compteRepository = compteRepository;
        this.membreRepo = membreRepo;
        this.refreshTokenRepo = refreshTokenRepo;
        this.jwtService = jwtService;
        this.personneProvisioningService = personneProvisioningService;
        this.personneRepository = personneRepository;
        this.registerService = registerService;
        this.tentativesConnexion = tentativesConnexion;
    }

    @Transactional
    public TokenResponse login(String email, String motDePasse, boolean rememberMe,
                               HttpServletRequest request, HttpServletResponse response) {
        tentativesConnexion.verifierNonVerrouille(email);
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, motDePasse));
        } catch (BadCredentialsException e) {
            tentativesConnexion.enregistrerEchec(email);
            throw e;
        }
        tentativesConnexion.reinitialiser(email);

        Compte compte = compteRepository.findByEmail(email)
            .orElseThrow(() -> new AuthenticationException("Compte introuvable") {});
        if (!compte.isEmailVerifie()) {
            throw new EmailNonVerifieException();
        }

        // JIT : couvre les comptes anterieurs a la creation systematique de la Personne.
        personneProvisioningService.provisionner(compte.getEmail(), compte.getNom(), compte.getPrenom());

        return emettreJetons(compte, rememberMe, request, response);
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
            throw new IllegalArgumentException("Refresh token expiré ou révoqué");
        }

        // Rotation : on revoque l'ancien et on emet un nouveau, en propageant la
        // preference "rester connecte" du jeton initial.
        token.setRevoque(true);
        refreshTokenRepo.save(token);

        return emettreJetons(token.getCompte(), token.isLongDuree(), request, response);
    }

    @Transactional
    public void logout(SolivioUserDetails userDetails, HttpServletRequest request,
                       HttpServletResponse response) {
        refreshTokenRepo.revoquerTousParCompte(userDetails.getCompteId());
        supprimerCookies(response);
    }

    /**
     * Finalise l'inscription Google : donne un role au compte, emet les tokens.
     * Retourne les tokens dans le corps (mobile) ET set les cookies (web).
     */
    @Transactional
    public TokenResponse completerInscriptionGoogle(String email, String nom, String prenom,
            String tokenInvitation, HttpServletRequest request, HttpServletResponse response) {
        Compte compte = registerService.finaliserCompteGoogle(email, nom, prenom, tokenInvitation);
        return emettreJetons(compte, false, request, response);
    }

    public MeResponse me(SolivioUserDetails userDetails) {
        Compte compte = compteRepository.findById(userDetails.getCompteId())
            .orElseThrow();
        List<String> roles = userDetails.getAuthorities().stream()
            .map(a -> Objects.requireNonNull(a.getAuthority())
                .replace("ROLE_", "").toLowerCase())
            .toList();
        Personne personne = personneRepository.findByCompteEmail(compte.getEmail()).orElse(null);
        String telephone = personne != null ? personne.getTelephone() : null;
        String photoUrl = compte.getPhotoUrl() != null
            ? compte.getPhotoUrl()
            : (personne != null ? personne.getPhotoUrl() : null);
        return new MeResponse(
            compte.getId().toString(),
            compte.getEmail(),
            compte.getNom(),
            compte.getPrenom(),
            telephone,
            photoUrl,
            compte.isSuperAdmin(),
            roles,
            compte.getDateCreation(),
            compte.getDateModification(),
            compte.isEmailVerifie(),
            compte.getGoogleId() != null ? "google" : "password"
        );
    }

    // Un membre suspendu ou sans role recoit un jeton sans role : il reste
    // authentifie mais aucun point d'entree metier ne lui est accessible.
    private TokenResponse emettreJetons(Compte compte, boolean longDuree,
                                        HttpServletRequest request, HttpServletResponse response) {
        Optional<MembreAssociation> membre = membreRepo.findActifByCompteId(compte.getId());
        List<String> roles = membre.map(m -> List.of(m.getRole())).orElse(List.of());
        String coordoType = membre.map(MembreAssociation::getCoordoType).orElse(null);

        String accessToken = jwtService.genererAccessToken(
            compte.getId(), compte.getEmail(), compte.getNom(), compte.getPrenom(),
            roles, coordoType, compte.isSuperAdmin()
        );

        emetAccessTokenCookie(accessToken, request, response);
        String refreshTokenBrut = emetRefreshTokenCookie(compte, request, response, longDuree);

        return TokenResponse.of(accessToken, jwtService.getAccessTokenMinutes() * 60, refreshTokenBrut);
    }

    private void emetAccessTokenCookie(String accessToken,
                                        HttpServletRequest request, HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("access_token", accessToken)
            .maxAge(jwtService.getAccessTokenMinutes() * 60)
            .path("/")
            .httpOnly(true)
            .secure(request.isSecure())
            .sameSite("Strict")
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private String emetRefreshTokenCookie(Compte compte,
                                          HttpServletRequest request, HttpServletResponse response,
                                          boolean longDuree) {
        String tokenBrut = jwtService.genererRefreshTokenBrut();
        String hash = jwtService.hasher(tokenBrut);

        RefreshToken rt = new RefreshToken(
            compte, hash,
            request.getHeader("User-Agent"),
            request.getRemoteAddr(),
            jwtService.refreshTokenExpiration(),
            longDuree
        );
        refreshTokenRepo.save(rt);

        // ResponseCookie.maxAge(-1) omet l'attribut Max-Age => cookie de session.
        // Ne pas construire "Max-Age=-1" en chaine brute : la RFC 6265 Section 5.2.2
        // impose que Max-Age <= 0 declenche l'expiration immediate du cookie.
        // Spring gere correctement ce cas : maxAge(-1) -> pas de Max-Age dans le header.
        // path "/" : le cookie doit etre lisible sur toutes les requetes (page et API)
        // pour permettre le refresh cote serveur depuis le proxy Next.js.
        ResponseCookie cookie = ResponseCookie.from("refresh_token", tokenBrut)
            .maxAge(longDuree ? jwtService.getRefreshTokenSeconds() : -1)
            .path("/")
            .httpOnly(true)
            .secure(request.isSecure())
            .sameSite("Strict")
            .build();
        response.addHeader("Set-Cookie", cookie.toString());
        return tokenBrut;
    }

    public void supprimerCookies(HttpServletResponse response) {
        response.addHeader("Set-Cookie",
            ResponseCookie.from("refresh_token", "")
                .maxAge(0).path("/").httpOnly(true).sameSite("Strict")
                .build().toString());
        response.addHeader("Set-Cookie",
            ResponseCookie.from("access_token", "")
                .maxAge(0).path("/").httpOnly(true).sameSite("Strict")
                .build().toString());
    }
}
