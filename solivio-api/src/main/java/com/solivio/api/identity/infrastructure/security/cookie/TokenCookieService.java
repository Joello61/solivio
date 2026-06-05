package com.solivio.api.identity.infrastructure.security.cookie;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Optional;

/**
 * Chiffrement AES-256-GCM des tokens dans des cookies HttpOnly.
 *
 * L'IV (12 octets) est prepend au chiffre, ce qui rend chaque cookie unique
 * meme pour le meme token. Le tag GCM detecte toute alteration du cookie.
 */
@Service
public class TokenCookieService {

    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    public static final String ID_TOKEN_COOKIE = "id_token";

    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_BITS = 128;

    private final SecretKey encryptionKey;

    public TokenCookieService(CookieProperties properties) {
        this.encryptionKey = properties.toSecretKey();
    }

    // --- Chiffrement / dechiffrement ---

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, new GCMParameterSpec(GCM_TAG_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] combined = new byte[iv.length + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

            return Base64.getUrlEncoder().withoutPadding().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException("Echec du chiffrement du cookie", e);
        }
    }

    public String decrypt(String encoded) {
        try {
            byte[] combined = Base64.getUrlDecoder().decode(encoded);
            byte[] iv = Arrays.copyOfRange(combined, 0, GCM_IV_LENGTH);
            byte[] ciphertext = Arrays.copyOfRange(combined, GCM_IV_LENGTH, combined.length);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey, new GCMParameterSpec(GCM_TAG_BITS, iv));

            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        } catch (AEADBadTagException e) {
            // Tag invalide = cookie altere ou cle incorrecte
            throw new SecurityException("Cookie altere ou cle de dechiffrement incorrecte", e);
        } catch (Exception e) {
            throw new IllegalStateException("Echec du dechiffrement du cookie", e);
        }
    }

    // --- Lecture des cookies ---

    public Optional<String> readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
            .filter(c -> name.equals(c.getName()))
            .findFirst()
            .map(Cookie::getValue);
    }

    public Optional<String> readDecryptedCookie(HttpServletRequest request, String name) {
        return readCookie(request, name).map(this::decrypt);
    }

    // --- Ecriture des cookies ---

    public void writeAccessTokenCookie(HttpServletResponse response,
                                       String token, int maxAgeSeconds) {
        writeHttpOnlyCookie(response, ACCESS_TOKEN_COOKIE, encrypt(token), maxAgeSeconds);
    }

    public void writeRefreshTokenCookie(HttpServletResponse response,
                                        String token, int maxAgeSeconds) {
        writeHttpOnlyCookie(response, REFRESH_TOKEN_COOKIE, encrypt(token), maxAgeSeconds);
    }

    public void writeIdTokenCookie(HttpServletResponse response,
                                   String token, int maxAgeSeconds) {
        writeHttpOnlyCookie(response, ID_TOKEN_COOKIE, encrypt(token), maxAgeSeconds);
    }

    public void deleteTokenCookies(HttpServletResponse response) {
        writeHttpOnlyCookie(response, ACCESS_TOKEN_COOKIE, "", 0);
        writeHttpOnlyCookie(response, REFRESH_TOKEN_COOKIE, "", 0);
        writeHttpOnlyCookie(response, ID_TOKEN_COOKIE, "", 0);
    }

    // --- Utilitaire interne ---

    private void writeHttpOnlyCookie(HttpServletResponse response,
                                     String name, String value, int maxAge) {
        // On construit le header Set-Cookie a la main pour controler SameSite,
        // car l'API Cookie de Jakarta Servlet ne supporte pas encore SameSite.
        String header = name + "=" + value
            + "; Max-Age=" + maxAge
            + "; Path=/"
            + "; HttpOnly"
            + "; SameSite=Strict";
        response.addHeader("Set-Cookie", header);
    }
}
