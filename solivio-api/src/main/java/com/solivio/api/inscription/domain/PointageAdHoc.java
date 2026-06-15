package com.solivio.api.inscription.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Presence d'un visiteur ponctuel sans compte Solivio.
 * Cree lors du pointage le jour J par un coordinateur ou responsable.
 */
@Entity
@Table(name = "pointage_ad_hoc")
@Getter
@Setter
@NoArgsConstructor
public class PointageAdHoc {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "distribution_id", nullable = false)
    private UUID distributionId;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(length = 255)
    private String email;

    @Column(length = 100)
    private String role;

    @Column(nullable = false, length = 20)
    private String presence = "PRESENT";

    @Column(name = "invitation_envoyee", nullable = false)
    private boolean invitationEnvoyee = false;

    @Column(name = "date_pointage", nullable = false, updatable = false)
    private Instant datePointage = Instant.now();

    public PointageAdHoc(UUID distributionId, String nom, String prenom, String email, String role) {
        this.distributionId = distributionId;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.role = role;
    }
}
