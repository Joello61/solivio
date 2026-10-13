package com.solivio.api.inscription.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "inscription")
@Getter
@Setter
@NoArgsConstructor
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "distribution_id", nullable = false)
    private UUID distributionId;

    @Column(name = "creneau_id")
    private UUID creneauId;

    @Column(name = "personne_id", nullable = false)
    private UUID personneId;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private TypeInscription type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatutInscription statut = StatutInscription.CONFIRMEE;

    // Statut avant une annulation de la distribution, pour la retablir si elle est reactivee.
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_avant_annulation", length = 20)
    private StatutInscription statutAvantAnnulation;

    @Column(name = "rang_liste_attente")
    private Integer rangListeAttente;

    @OneToMany(mappedBy = "inscription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<RoleBenevoleInscription> roles = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private StatutPresence presence = StatutPresence.NON_POINTE;

    // RG4 : absence enregistree a la cloture faute de pointage, et non pointee.
    @Column(name = "absence_deduite", nullable = false)
    private boolean absenceDeduite;

    @Column(name = "date_pointage")
    private Instant datePointage;

    @Column(name = "pointe_par_id")
    private UUID pointeParId;

    @Column(name = "date_inscription", nullable = false, updatable = false)
    private Instant dateInscription = Instant.now();

    public Inscription(
        UUID distributionId,
        UUID creneauId,
        UUID personneId,
        String nom,
        String prenom,
        TypeInscription type
    ) {
        this.distributionId = distributionId;
        this.creneauId = creneauId;
        this.personneId = personneId;
        this.nom = nom;
        this.prenom = prenom;
        this.type = type;
    }

    public void placerEnListeAttente(int rang) {
        this.statut = StatutInscription.LISTE_ATTENTE;
        this.rangListeAttente = rang;
    }

    public void promouvoir() {
        this.statut = StatutInscription.CONFIRMEE;
        this.rangListeAttente = null;
    }

    public void annuler() {
        this.statut = StatutInscription.ANNULEE;
        // Une desinscription personnelle n'est pas retablie par une reactivation.
        this.statutAvantAnnulation = null;
    }

    // Reinscription apres annulation : remet la ligne a son etat initial.
    // Nom et prenom sont rafraichis en cas de modification entre les deux inscriptions.
    public void reinitialiser(UUID nouveauCreneauId, String nouveauNom, String nouveauPrenom) {
        this.creneauId = nouveauCreneauId;
        this.nom = nouveauNom;
        this.prenom = nouveauPrenom;
        this.statut = StatutInscription.CONFIRMEE;
        this.rangListeAttente = null;
        this.presence = StatutPresence.NON_POINTE;
        this.absenceDeduite = false;
        this.statutAvantAnnulation = null;
        this.datePointage = null;
        this.pointeParId = null;
        this.dateInscription = Instant.now();
        this.roles.clear();
    }

    public void pointer(StatutPresence statutPresence, UUID pointeParId) {
        this.presence = statutPresence;
        this.absenceDeduite = false;
        this.datePointage = Instant.now();
        this.pointeParId = pointeParId;
    }

    /** RG4 : beneficiaire confirme reste non pointe a la cloture. */
    public void enregistrerAbsenceDeduite() {
        this.presence = StatutPresence.ABSENT;
        this.absenceDeduite = true;
    }

    /** Annulation par la distribution : le statut est garde pour une eventuelle reactivation. */
    public void annulerParDistribution() {
        this.statutAvantAnnulation = statut;
        this.statut = StatutInscription.ANNULEE;
    }

    /** Distribution reactivee : l'inscription retrouve son statut et son rang. */
    public void retablir() {
        this.statut = statutAvantAnnulation;
        this.statutAvantAnnulation = null;
    }

    /** Pas de retablissement possible (RG1) : l'inscription reste annulee. */
    public void renoncerAuRetablissement() {
        this.statutAvantAnnulation = null;
    }

    public boolean estActive() {
        return statut == StatutInscription.CONFIRMEE || statut == StatutInscription.LISTE_ATTENTE;
    }
}
