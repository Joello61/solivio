package com.solivio.api.evenement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "participation_evenement")
@Getter
@Setter
@NoArgsConstructor
public class ParticipationEvenement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "evenement_id", nullable = false)
    private UUID evenementId;

    @Column(name = "personne_id", nullable = false)
    private UUID personneId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleParticipation role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PresenceEvenement presence = PresenceEvenement.NON_POINTE;

    @Column(name = "date_inscription", nullable = false, updatable = false)
    private Instant dateInscription = Instant.now();

    public ParticipationEvenement(UUID evenementId, UUID personneId, RoleParticipation role) {
        this.evenementId = evenementId;
        this.personneId = personneId;
        this.role = role;
    }
}
