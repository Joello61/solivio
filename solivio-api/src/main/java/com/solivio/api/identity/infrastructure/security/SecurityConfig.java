package com.solivio.api.identity.infrastructure.security;

import com.solivio.api.shared.web.ApiError;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Clock;
import java.util.List;

/**
 * Configuration de securite Spring Security.
 * Stateless JWT : pas de session HTTP cote serveur.
 * Deux modes de transport du token : cookie HttpOnly (web) et Bearer header (mobile).
 * CSRF desactive : tokens JWT + CORS proteges par origin suffisent pour une API REST.
 * Google OAuth2 via oauth2Login() : apres succes, emit un JWT Solivio.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(CorsProperties.class)
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SolivioUserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final CorsProperties corsProperties;
    private final GoogleOAuth2UserService googleOAuth2UserService;
    private final GoogleOAuth2SuccessHandler googleOAuth2SuccessHandler;
    private final Environment environment;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            SolivioUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder,
            CorsProperties corsProperties,
            GoogleOAuth2UserService googleOAuth2UserService,
            GoogleOAuth2SuccessHandler googleOAuth2SuccessHandler,
            Environment environment) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
        this.corsProperties = corsProperties;
        this.googleOAuth2UserService = googleOAuth2UserService;
        this.googleOAuth2SuccessHandler = googleOAuth2SuccessHandler;
        this.environment = environment;
    }

    @Bean
    public LimiteDebitAuthFilter limiteDebitAuthFilter(
            @Value("${solivio.securite.limite-debit-auth.requetes-par-minute:10}") int requetesParMinute) {
        return new LimiteDebitAuthFilter(Clock.systemUTC(), requetesParMinute);
    }

    // Le filtre n'est execute que dans la chaine de securite, pas une seconde
    // fois comme filtre servlet enregistre automatiquement par Spring Boot.
    @Bean
    public FilterRegistrationBean<LimiteDebitAuthFilter> limiteDebitAuthFilterRegistration(
            LimiteDebitAuthFilter filter) {
        FilterRegistrationBean<LimiteDebitAuthFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, LimiteDebitAuthFilter limiteDebitAuthFilter)
            throws Exception {
        return http
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // CSRF desactive : API REST stateless avec JWT. Le CORS + SameSite protegent contre le CSRF.
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // Endpoints d'authentification publics
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/refresh",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/auth/verify-email",
                    "/api/auth/resend-verification",
                    "/api/auth/google/mobile-init",
                    "/api/auth/google/link-mobile-init",
                    "/api/auth/google/complete-registration",
                    "/api/invitations/*/details",
                    "/api/public/**"
                ).permitAll()
                // Google OAuth2 initiation et callback
                .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                // Infrastructure
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // Swagger : public en dev/test, bloque en prod.
                .requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                    .access((a, ctx) -> new org.springframework.security.authorization.AuthorizationDecision(
                        environment.acceptsProfiles(Profiles.of("dev | test"))))
                .anyRequest().authenticated()
            )
            // Google OAuth2 : apres succes, GoogleOAuth2SuccessHandler emet un JWT Solivio.
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(ui -> ui.userService(googleOAuth2UserService))
                .successHandler(googleOAuth2SuccessHandler)
            )
            // Pour les requetes API non authentifiees : 401 JSON au lieu d'une redirection 302.
            // Le frontend gere la redirection vers /login lorsqu'il recoit un 401.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) ->
                    ApiError.ecrire(response, HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Authentification requise."))
                .accessDeniedHandler((request, response, accessDeniedException) ->
                    ApiError.ecrire(response, HttpStatus.FORBIDDEN, "FORBIDDEN",
                        "Vous n'avez pas les droits necessaires pour cette operation."))
            )
            .addFilterBefore(limiteDebitAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(corsProperties.getAllowedOriginsList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        // Requis pour envoyer les cookies cross-origin en dev (Next.js port 3000 -> Spring port 8080).
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
