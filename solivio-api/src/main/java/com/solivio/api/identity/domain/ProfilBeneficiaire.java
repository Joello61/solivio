package com.solivio.api.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Donnees sociales sensibles du beneficiaire. Separees de Personne
 * pour restreindre l'acces independamment de l'identite de base.
 * Un benevole au pointage voit Personne, jamais ProfilBeneficiaire.
 */
@Entity
@Table(name = "profil_beneficiaire")
@Getter
@Setter
@NoArgsConstructor
public class ProfilBeneficiaire {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "personne_id", nullable = false, unique = true)
    private Personne personne;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "statut_boursier", length = 20)
    private String statutBoursier;

    @Column(name = "echelon_bourse")
    private Integer echelonBourse;

    @Column(name = "categorie_nationalite", length = 20)
    private String categorieNationalite;

    @Column(name = "reste_a_vivre_mensuel", precision = 10, scale = 2)
    private BigDecimal resteAVivreMensuel;

    @Column(name = "niveau_academique", length = 20)
    private String niveauAcademique;

    @Column(name = "etablissement")
    private String etablissement;

    @Column(name = "situation_logement", length = 30)
    private String situationLogement;

    @Column(name = "a_emploi_etudiant")
    private Boolean aEmploiEtudiant;

    public ProfilBeneficiaire(Personne personne) {
        this.personne = personne;
    }
}
