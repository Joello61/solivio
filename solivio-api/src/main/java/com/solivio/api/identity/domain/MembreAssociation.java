package com.solivio.api.identity.domain;

import com.solivio.api.shared.temps.HorlogeAssociation;
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

import java.time.LocalDate;
import java.util.UUID;

/**
 * Role d'un Compte dans l'association (au plus un par compte).
 * coordo_type : sous-type libre pour les coordinateurs (ex: coordo_sec, coordo_fruit).
 */
@Entity
@Table(name = "membre")
@Getter
@Setter
@NoArgsConstructor
public class MembreAssociation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compte_id", nullable = false)
    private Compte compte;

    @Column(nullable = false, length = 30)
    private String role;

    @Column(name = "coordo_type", length = 50)
    private String coordoType;

    @Column(nullable = false, length = 25)
    private String statut = "actif";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invite_par")
    private Compte invitePar;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut = LocalDate.now(HorlogeAssociation.ZONE_PAR_DEFAUT);

    @Column(name = "date_fin")
    private LocalDate dateFin;

    public MembreAssociation(Compte compte, String role) {
        this.compte = compte;
        this.role = role;
    }

    public boolean estActive() {
        return "actif".equals(statut)
            && (dateFin == null || dateFin.isAfter(LocalDate.now(HorlogeAssociation.ZONE_PAR_DEFAUT)));
    }
}
