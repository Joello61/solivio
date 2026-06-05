package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.identity.infrastructure.security.cookie.CompositeBearerTokenResolver;
import com.solivio.api.identity.infrastructure.security.cookie.CorsProperties;
import com.solivio.api.identity.infrastructure.security.cookie.HttpCookieOAuth2AuthorizationRequestRepository;
import com.solivio.api.identity.infrastructure.security.cookie.TokenCookieAuthenticationSuccessHandler;
import com.solivio.api.identity.infrastructure.security.cookie.TokenCookieService;
import com.solivio.api.identity.infrastructure.security.cookie.TokenRefreshFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final KeycloakJwtConverter keycloakJwtConverter;
    private final TenantResolutionFilter tenantResolutionFilter;
    private final JitProvisioningFilter jitProvisioningFilter;
    private final TokenCookieService tokenCookieService;
    private final CorsProperties corsProperties;

    public SecurityConfig(
            KeycloakJwtConverter keycloakJwtConverter,
            TenantResolutionFilter tenantResolutionFilter,
            JitProvisioningFilter jitProvisioningFilter,
            TokenCookieService tokenCookieService,
            CorsProperties corsProperties) {
        this.keycloakJwtConverter = keycloakJwtConverter;
        this.tenantResolutionFilter = tenantResolutionFilter;
        this.jitProvisioningFilter = jitProvisioningFilter;
        this.tokenCookieService = tokenCookieService;
        this.corsProperties = corsProperties;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            HttpCookieOAuth2AuthorizationRequestRepository authRequestRepo,
            TokenCookieAuthenticationSuccessHandler successHandler,
            TokenRefreshFilter tokenRefreshFilter,
            LogoutSuccessHandler logoutSuccessHandler) throws Exception {

        return http
            // Stateless : aucune session HTTP cote serveur.
            // L'etat OAuth2 du flow de connexion passe par un cookie (authRequestRepo).
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // CORS : Next.js (port 3000) appelle l'API Spring Boot (port 8080).
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // CSRF : spa() configure CookieCsrfTokenRepository + SpaCsrfTokenRequestHandler.
            // Le frontend lit XSRF-TOKEN et le renvoie dans X-XSRF-TOKEN.
            .csrf(csrf -> csrf.spa())

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/oauth2/**",
                    "/login/**",
                    "/logout",
                    "/actuator/health",
                    "/actuator/info",
                    "/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                .anyRequest().authenticated()
            )

            .logout(logout -> logout
                .logoutUrl("/logout")
                .addLogoutHandler((request, response, auth) ->
                    tokenCookieService.deleteTokenCookies(response))
                .logoutSuccessHandler(logoutSuccessHandler)
                .permitAll()
            )

            // BFF : Spring Boot gere le flow OIDC avec Keycloak.
            // Apres auth : les tokens sont chiffres dans des cookies HttpOnly.
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(ep -> ep
                    .authorizationRequestRepository(authRequestRepo))
                .successHandler(successHandler)
            )

            // Resource server : valide le JWT depuis le cookie access_token.
            // L'autorite en matiere de droits reste cote backend (art. 8.3 arch. technique).
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakJwtConverter))
                .bearerTokenResolver(new CompositeBearerTokenResolver(tokenCookieService))
            )

            // Refresh avant la validation JWT, resolution tenant et provisioning JIT apres.
            .addFilterBefore(tokenRefreshFilter, BearerTokenAuthenticationFilter.class)
            .addFilterAfter(tenantResolutionFilter, BearerTokenAuthenticationFilter.class)
            .addFilterAfter(jitProvisioningFilter, TenantResolutionFilter.class)

            .build();
    }

    @Bean
    public HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository() {
        return new HttpCookieOAuth2AuthorizationRequestRepository();
    }

    @Bean
    public TokenCookieAuthenticationSuccessHandler tokenCookieSuccessHandler(
            OAuth2AuthorizedClientService authorizedClientService,
            HttpCookieOAuth2AuthorizationRequestRepository authRequestRepo,
            @Value("${solivio.auth.post-login-redirect-uri}") String postLoginRedirectUri) {
        return new TokenCookieAuthenticationSuccessHandler(
            tokenCookieService, authorizedClientService, authRequestRepo, postLoginRedirectUri);
    }

    @Bean
    public TokenRefreshFilter tokenRefreshFilter(
            OAuth2AuthorizedClientManager clientManager,
            ClientRegistrationRepository clientRegistrationRepository,
            JwtDecoder jwtDecoder) {
        return new TokenRefreshFilter(
            tokenCookieService, clientManager, clientRegistrationRepository, jwtDecoder);
    }

    @Bean
    public OAuth2AuthorizedClientManager authorizedClientManager(
            ClientRegistrationRepository clientRegistrationRepository,
            OAuth2AuthorizedClientRepository authorizedClientRepository) {
        DefaultOAuth2AuthorizedClientManager manager =
            new DefaultOAuth2AuthorizedClientManager(
                clientRegistrationRepository, authorizedClientRepository);
        manager.setAuthorizedClientProvider(
            OAuth2AuthorizedClientProviderBuilder.builder()
                .authorizationCode()
                .refreshToken()
                .build());
        return manager;
    }

    @Bean
    public LogoutSuccessHandler logoutSuccessHandler(
            @Value("${solivio.auth.keycloak-issuer-uri}") String issuerUri,
            @Value("${solivio.auth.post-logout-redirect-uri}") String postLogoutRedirectUri) {
        return new KeycloakOidcLogoutSuccessHandler(tokenCookieService, issuerUri, postLogoutRedirectUri);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(corsProperties.getAllowedOriginsList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        // Necessaire pour que le navigateur envoie les cookies cross-origin (meme site local).
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
