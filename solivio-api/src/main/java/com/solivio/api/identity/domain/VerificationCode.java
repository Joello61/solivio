package com.solivio.api.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Code a 6 chiffres a usage unique pour la verification d'email ou le reset de mot de passe.
 * Expire apres 15 minutes. Invalide apres la premiere utilisation reussie.
 */
@Entity
@Table(name = "verification_code")
@Getter
@Setter
@NoArgsConstructor
public class VerificationCode {

    public static final String TYPE_EMAIL = "email_verification";
    public static final String TYPE_PASSWORD_RESET = "password_reset";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compte_id", nullable = false)
    private Compte compte;

    @Column(nullable = false, length = 6)
    private String code;

    @Column(nullable = false, length = 25)
    private String type;

    @Column(name = "expire_a", nullable = false)
    private Instant expireA;

    @Column(nullable = false)
    private boolean utilise = false;

    @Column(name = "cree_a", nullable = false, updatable = false)
    private Instant creeA = Instant.now();

    public VerificationCode(Compte compte, String code, String type, Instant expireA) {
        this.compte = compte;
        this.code = code;
        this.type = type;
        this.expireA = expireA;
    }

    public boolean estValide() {
        return !utilise && Instant.now().isBefore(expireA);
    }
}
