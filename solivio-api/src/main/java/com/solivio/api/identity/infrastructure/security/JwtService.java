package com.solivio.api.identity.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Emission et validation des JWT access tokens (JJWT 0.13.0, HMAC-SHA256).
 * Les refresh tokens sont des UUID opaques dont seul le hash est stocke en DB.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private static final String CLAIM_TENANT = "tenant";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_COORDO_TYPE = "coordo_type";
    private static final String CLAIM_SUPER_ADMIN = "super_admin";
    private static final String CLAIM_NOM = "nom";
    private static final String CLAIM_PRENOM = "prenom";

    private final SecretKey signingKey;
    private final long accessTokenMinutes;
    private final long refreshTokenDays;

    public JwtService(
            @Value("${solivio.auth.jwt-secret}") String jwtSecret,
            @Value("${solivio.auth.access-token-expiration-minutes:15}") long accessTokenMinutes,
            @Value("${solivio.auth.refresh-token-expiration-days:30}") long refreshTokenDays) {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenMinutes = accessTokenMinutes;
        this.refreshTokenDays = refreshTokenDays;
    }

    public String genererAccessToken(UUID compteId, String email, String nom, String prenom,
                                     String tenantSlug, List<String> roles,
                                     String coordoType, boolean superAdmin) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(accessTokenMinutes * 60);

        Map<String, Object> claims = new java.util.HashMap<>();
        claims.put(CLAIM_NOM, nom);
        claims.put(CLAIM_PRENOM, prenom);
        claims.put(CLAIM_ROLES, roles);
        claims.put(CLAIM_SUPER_ADMIN, superAdmin);
        if (tenantSlug != null) {
            claims.put(CLAIM_TENANT, tenantSlug);
        }
        if (coordoType != null) {
            claims.put(CLAIM_COORDO_TYPE, coordoType);
        }

        return Jwts.builder()
            .subject(compteId.toString())
            .claim("email", email)
            .claims(claims)
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .signWith(signingKey)
            .compact();
    }

    public Claims valider(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public boolean estValide(String token) {
        try {
            valider(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT invalide : {}", e.getMessage());
            return false;
        }
    }

    /** Genere un refresh token opaque (UUID) et retourne sa valeur en clair. */
    public String genererRefreshTokenBrut() {
        return UUID.randomUUID().toString();
    }

    /** Retourne le SHA-256 hexadecimal d'un token brut pour stockage en DB. */
    public String hasher(String tokenBrut) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(tokenBrut.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible", e);
        }
    }

    public long getAccessTokenMinutes() {
        return accessTokenMinutes;
    }

    public long getRefreshTokenSeconds() {
        return refreshTokenDays * 24 * 3600;
    }

    public Instant refreshTokenExpiration() {
        return Instant.now().plusSeconds(getRefreshTokenSeconds());
    }
}
