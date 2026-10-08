package com.solivio.api.identity.infrastructure.web.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public class MotDePasseRobusteValidator implements ConstraintValidator<MotDePasseRobuste, String> {

    static final int LONGUEUR_MIN = 8;
    static final int LONGUEUR_MAX = 128;

    private static final Set<String> MOTS_DE_PASSE_COURANTS = charger("/securite/mots-de-passe-courants.txt");

    @Override
    public boolean isValid(String motDePasse, ConstraintValidatorContext context) {
        if (motDePasse == null) {
            // @NotBlank se charge de l'absence de valeur.
            return true;
        }
        int longueur = motDePasse.codePointCount(0, motDePasse.length());
        return longueur >= LONGUEUR_MIN
            && longueur <= LONGUEUR_MAX
            && !MOTS_DE_PASSE_COURANTS.contains(motDePasse.toLowerCase(Locale.ROOT));
    }

    private static Set<String> charger(String ressource) {
        try (InputStream in = MotDePasseRobusteValidator.class.getResourceAsStream(ressource)) {
            if (in == null) {
                throw new IllegalStateException("Liste de mots de passe courants introuvable : " + ressource);
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                return reader.lines()
                    .map(String::strip)
                    .filter(l -> !l.isEmpty() && !l.startsWith("#"))
                    .map(l -> l.toLowerCase(Locale.ROOT))
                    .collect(Collectors.toUnmodifiableSet());
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
