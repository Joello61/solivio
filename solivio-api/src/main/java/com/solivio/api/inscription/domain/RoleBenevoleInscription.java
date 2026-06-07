package com.solivio.api.inscription.domain;

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

import java.util.UUID;

@Entity
@Table(name = "role_benevole_inscription")
@Getter
@Setter
@NoArgsConstructor
public class RoleBenevoleInscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id", nullable = false)
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_role_id")
    private TypeRole typeRole;

    @Column(name = "libelle_libre", length = 200)
    private String libelleLibre;

    public RoleBenevoleInscription(Inscription inscription, TypeRole typeRole, String libelleLibre) {
        this.inscription = inscription;
        this.typeRole = typeRole;
        this.libelleLibre = libelleLibre;
    }

    // Libelle effectif : celui du catalogue si disponible, sinon le texte libre.
    public String libelleEffectif() {
        return typeRole != null ? typeRole.getLibelle() : libelleLibre;
    }
}
