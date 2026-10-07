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
 * Refresh token JWT stocke en DB pour permettre la revocation et la rotation.
 * token_hash : SHA-256 du token en clair (le token brut ne quitte jamais le serveur).
 * revoque    : mis a true lors du logout ou d'une reutilisation detectee.
 */
@Entity
@Table(name = "refresh_token")
@Getter
@Setter
@NoArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compte_id", nullable = false)
    private Compte compte;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "expire_a", nullable = false)
    private Instant expireA;

    @Column(nullable = false)
    private boolean revoque = false;

    // true = cookie persistant (Max-Age=30j), false = cookie de session.
    // Preserve la preference "rester connecte" du login initial lors des rotations.
    @Column(name = "long_duree", nullable = false)
    private boolean longDuree = false;

    @Column(name = "cree_a", nullable = false, updatable = false)
    private Instant creeA = Instant.now();

    public RefreshToken(Compte compte, String tokenHash,
                        String userAgent, String ipAddress, Instant expireA, boolean longDuree) {
        this.compte = compte;
        this.tokenHash = tokenHash;
        this.userAgent = userAgent;
        this.ipAddress = ipAddress;
        this.expireA = expireA;
        this.longDuree = longDuree;
    }

    public boolean estExpire() {
        return Instant.now().isAfter(expireA);
    }
}
