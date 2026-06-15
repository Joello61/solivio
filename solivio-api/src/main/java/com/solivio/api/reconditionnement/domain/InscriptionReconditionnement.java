package com.solivio.api.reconditionnement.domain;

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
@Table(name = "inscription_reconditionnement")
@Getter
@Setter
@NoArgsConstructor
public class InscriptionReconditionnement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "personne_id", nullable = false)
    private UUID personneId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutPresenceReconditionnement presence = StatutPresenceReconditionnement.NON_POINTE;

    @Column(nullable = false, length = 20)
    private String statut = "CONFIRMEE";

    @Column(name = "date_inscription", nullable = false, updatable = false)
    private Instant dateInscription = Instant.now();

    public InscriptionReconditionnement(UUID sessionId, UUID personneId) {
        this.sessionId = sessionId;
        this.personneId = personneId;
    }

    public void annuler() {
        this.statut = "ANNULEE";
    }

    public void pointer(StatutPresenceReconditionnement presence) {
        this.presence = presence;
    }

    public boolean estConfirmee() {
        return "CONFIRMEE".equals(this.statut);
    }
}
