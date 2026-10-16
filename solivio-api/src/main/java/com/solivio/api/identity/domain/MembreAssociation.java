package com.solivio.api.identity.domain;

import com.solivio.api.shared.temps.HorlogeAssociation;
import com.solivio.api.shared.exception.ConflictException;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Appartenance d'un Compte a l'association et ses roles (ADR-012) : benevole,
 * beneficiaire et coordinateur se cumulent, responsable est exclusif.
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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "membre_role", joinColumns = @JoinColumn(name = "membre_id"))
    @Column(name = "role", length = 30)
    @Setter(AccessLevel.NONE)
    private Set<String> roles = new HashSet<>();

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
        this(compte, Set.of(role));
    }

    public MembreAssociation(Compte compte, Collection<String> roles) {
        this.compte = compte;
        remplacerRoles(roles);
    }

    public Set<String> getRoles() {
        return Collections.unmodifiableSet(roles);
    }

    /** Roles tries, pour un jeton et des reponses stables. */
    public List<String> rolesTries() {
        return roles.stream().sorted().toList();
    }

    public boolean aLeRole(String role) {
        return roles.contains(role);
    }

    public boolean estResponsable() {
        return aLeRole(RolesMembre.RESPONSABLE);
    }

    /** Remplace tous les roles, en verifiant qu'il en reste un et que responsable reste seul. */
    public void remplacerRoles(Collection<String> nouveaux) {
        Set<String> valides = Set.copyOf(nouveaux);
        if (valides.isEmpty()) {
            throw new ConflictException("Un membre garde au moins un rôle.");
        }
        if (valides.contains(RolesMembre.RESPONSABLE) && valides.size() > 1) {
            throw new ConflictException("Un responsable n'a pas d'autre rôle.");
        }
        if (!valides.contains(RolesMembre.RESPONSABLE) && !RolesMembre.CUMULABLES.containsAll(valides)) {
            throw new IllegalArgumentException("Rôle inconnu.");
        }
        roles.clear();
        roles.addAll(valides);
        if (!valides.contains(RolesMembre.COORDINATEUR)) {
            coordoType = null;
        }
    }

    /** Ajoute un role cumulable ; un responsable ne cumule pas. */
    public void ajouterRole(String role) {
        if (estResponsable()) {
            throw new ConflictException("Un responsable n'a pas d'autre rôle.");
        }
        Set<String> nouveaux = new HashSet<>(roles);
        nouveaux.add(role);
        remplacerRoles(nouveaux);
    }

    public boolean estActive() {
        return "actif".equals(statut)
            && (dateFin == null || dateFin.isAfter(LocalDate.now(HorlogeAssociation.ZONE_PAR_DEFAUT)));
    }
}
