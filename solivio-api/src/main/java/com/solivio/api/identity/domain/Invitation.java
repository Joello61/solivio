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
 * Invitation envoyee par email pour rejoindre une association avec un role pre-assigne.
 * Le token UUID est inclus dans le lien envoye par email (expire apres 7 jours).
 */
@Entity
@Table(name = "invitation")
@Getter
@Setter
@NoArgsConstructor
public class Invitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false, length = 30)
    private String role;

    @Column(name = "coordo_type", length = 50)
    private String coordoType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invite_par", nullable = false)
    private Compte invitePar;

    @Column(nullable = false, unique = true)
    private UUID token = UUID.randomUUID();

    @Column(nullable = false, length = 20)
    private String statut = "pending";

    @Column(name = "expire_a", nullable = false)
    private Instant expireA;

    @Column(name = "cree_a", nullable = false, updatable = false)
    private Instant creeA = Instant.now();

    public Invitation(String email, String role, Compte invitePar, Instant expireA) {
        this.email = email;
        this.role = role;
        this.invitePar = invitePar;
        this.expireA = expireA;
    }

    public boolean estValide() {
        return "pending".equals(statut) && Instant.now().isBefore(expireA);
    }
}
