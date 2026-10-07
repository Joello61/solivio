package com.solivio.api.identity.infrastructure.web.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Politique de mot de passe (NIST SP 800-63B) : 8 a 128 caracteres, et absent
 * de la liste des mots de passe les plus courants. Pas de regle de composition
 * imposee : elle pousse vers des mots de passe previsibles sans gain reel.
 */
@Documented
@Constraint(validatedBy = MotDePasseRobusteValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface MotDePasseRobuste {

    String message() default "Le mot de passe doit contenir entre 8 et 128 caracteres et ne pas etre un mot de passe courant";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
