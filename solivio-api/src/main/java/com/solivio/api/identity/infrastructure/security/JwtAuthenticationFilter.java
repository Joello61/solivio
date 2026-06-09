package com.solivio.api.identity.infrastructure.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Extrait le JWT depuis le cookie "access_token" ou le header Authorization Bearer.
 * Valide le token et alimente le SecurityContext avec un SolivioUserDetails.
 * Compatible web (cookie) et mobile (Bearer header).
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final String ACCESS_TOKEN_COOKIE = "access_token";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String token = extraireToken(request);
        if (token != null && jwtService.estValide(token)) {
            try {
                Claims claims = jwtService.valider(token);
                SolivioUserDetails userDetails = construireUserDetails(claims);
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            } catch (Exception e) {
                log.debug("Echec construction UserDetails depuis JWT : {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extraireToken(HttpServletRequest request) {
        // 1. Cookie HttpOnly (web) - prioritaire
        if (request.getCookies() != null) {
            Optional<String> cookieToken = Arrays.stream(request.getCookies())
                .filter(c -> ACCESS_TOKEN_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst();
            if (cookieToken.isPresent()) {
                return cookieToken.get();
            }
        }
        // 2. Bearer header (mobile / SPA sans cookie)
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private SolivioUserDetails construireUserDetails(Claims claims) {
        UUID compteId = UUID.fromString(claims.getSubject());
        String email = claims.get("email", String.class);
        String tenantSlug = claims.get("tenant", String.class);
        boolean superAdmin = Boolean.TRUE.equals(claims.get("super_admin", Boolean.class));

        List<String> roles = claims.get("roles", List.class);
        java.util.ArrayList<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>(
            roles == null ? List.of() :
            roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase())).toList()
        );
        if (superAdmin) {
            authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
        }

        return new SolivioUserDetails(
            compteId, email, null, tenantSlug, superAdmin, authorities, true
        );
    }
}
