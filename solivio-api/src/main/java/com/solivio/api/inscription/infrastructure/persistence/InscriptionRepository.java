package com.solivio.api.inscription.infrastructure.persistence;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.TypeInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InscriptionRepository extends JpaRepository<Inscription, UUID> {

    List<Inscription> findByDistributionIdOrderByNomAscPrenomAsc(UUID distributionId);

    Optional<Inscription> findByIdAndDistributionId(UUID id, UUID distributionId);

    List<Inscription> findByDistributionIdAndStatutIn(UUID distributionId, Collection<StatutInscription> statuts);

    boolean existsByDistributionIdAndPersonneIdAndTypeAndStatut(
        UUID distributionId, UUID personneId, TypeInscription type, StatutInscription statut
    );

    List<Inscription> findByDistributionIdAndStatutOrderByNomAscPrenomAsc(
        UUID distributionId, StatutInscription statut
    );

    // Au plus une ligne par (distribution, personne, type) grace a la contrainte unique en V10.
    Optional<Inscription> findByDistributionIdAndPersonneIdAndType(
        UUID distributionId, UUID personneId, TypeInscription type
    );

    long countByDistributionIdAndTypeAndStatut(
        UUID distributionId, TypeInscription type, StatutInscription statut
    );

    long countByDistributionIdAndCreneauIdAndTypeAndStatut(
        UUID distributionId, UUID creneauId, TypeInscription type, StatutInscription statut
    );

    // Liste d'attente dans l'ordre de promotion (RG3)
    List<Inscription> findByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
        UUID distributionId, TypeInscription type, StatutInscription statut
    );

    // Rang max en liste d'attente pour calculer le rang du nouvel inscrit
    @Query("SELECT MAX(i.rangListeAttente) FROM Inscription i "
        + "WHERE i.distributionId = :distId AND i.type = :type AND i.statut = 'LISTE_ATTENTE'")
    Optional<Integer> findMaxRangListeAttente(
        @Param("distId") UUID distributionId, @Param("type") TypeInscription type
    );

    // RG1 : inscriptions beneficiaire actives (confirmees ou en attente) d'une
    // personne sur un ensemble de distributions
    @Query("SELECT COUNT(i) FROM Inscription i "
        + "WHERE i.personneId = :personneId AND i.type = 'BENEFICIAIRE' "
        + "AND i.statut IN ('CONFIRMEE', 'LISTE_ATTENTE') "
        + "AND i.distributionId IN :distributionIds")
    long compterInscriptionsBeneficiaireActives(
        @Param("personneId") UUID personneId,
        @Param("distributionIds") Collection<UUID> distributionIds
    );

    // Pointage : recherche par nom ou prenom (insensible a la casse)
    @Query("SELECT i FROM Inscription i "
        + "WHERE i.distributionId = :distId "
        + "AND i.statut = 'CONFIRMEE' "
        + "AND (LOWER(i.nom) LIKE LOWER(CONCAT('%', :recherche, '%')) "
        + "OR LOWER(i.prenom) LIKE LOWER(CONCAT('%', :recherche, '%')))")
    List<Inscription> rechercherPourPointage(
        @Param("distId") UUID distributionId, @Param("recherche") String recherche
    );

    List<Inscription> findByPersonneIdAndDistributionIdOrderByDateInscriptionDesc(
        UUID personneId, UUID distributionId
    );

    List<Inscription> findByPersonneIdOrderByDateInscriptionDesc(UUID personneId);

    // RG4 : absences passees par beneficiaire (batch pour eviter le N+1).
    // Renvoie des paires [personneId, count] pour les personneIds fournis.
    @Query("SELECT i.personneId, COUNT(i) FROM Inscription i "
        + "WHERE i.personneId IN :personneIds "
        + "AND i.type = 'BENEFICIAIRE' "
        + "AND i.presence = 'ABSENT' "
        + "GROUP BY i.personneId")
    List<Object[]> compterAbsencesParPersonnes(@Param("personneIds") List<UUID> personneIds);

    // Repartition : base presents (pointage effectue)
    @Query("SELECT COUNT(i) FROM Inscription i "
        + "WHERE i.distributionId = :distId "
        + "AND i.type = 'BENEFICIAIRE' "
        + "AND i.presence = 'PRESENT'")
    long compterBeneficiairesPresents(@Param("distId") UUID distributionId);

    // Statistiques : beneficiaires CONFIRMEE par distribution
    @Query("SELECT COUNT(i) FROM Inscription i "
        + "WHERE i.distributionId = :distId "
        + "AND i.type = 'BENEFICIAIRE' AND i.statut = 'CONFIRMEE'")
    long compterInscritsBeneficiaires(@Param("distId") UUID distributionId);

    // Statistiques : benevoles CONFIRMEE par distribution
    @Query("SELECT COUNT(i) FROM Inscription i "
        + "WHERE i.distributionId = :distId "
        + "AND i.type = 'BENEVOLE' AND i.statut = 'CONFIRMEE'")
    long compterInscritsBenevoles(@Param("distId") UUID distributionId);

    // Statistiques : absents confirmes par distribution
    @Query("SELECT COUNT(i) FROM Inscription i "
        + "WHERE i.distributionId = :distId "
        + "AND i.type = 'BENEFICIAIRE' AND i.statut = 'CONFIRMEE' AND i.presence = 'ABSENT'")
    long compterAbsentsBeneficiaires(@Param("distId") UUID distributionId);

    // Statistiques : non pointes confirmes par distribution
    @Query("SELECT COUNT(i) FROM Inscription i "
        + "WHERE i.distributionId = :distId "
        + "AND i.type = 'BENEFICIAIRE' AND i.statut = 'CONFIRMEE' AND i.presence = 'NON_POINTE'")
    long compterNonPointesBeneficiaires(@Param("distId") UUID distributionId);

    // Statistiques periode : beneficiaires distincts PRESENT sur plusieurs distributions
    @Query("SELECT COUNT(DISTINCT i.personneId) FROM Inscription i "
        + "WHERE i.distributionId IN :distributionIds "
        + "AND i.type = 'BENEFICIAIRE' AND i.presence = 'PRESENT'")
    long compterBeneficiairesDistinctsServis(@Param("distributionIds") List<UUID> distributionIds);

    // Statistiques periode : benevoles distincts CONFIRMEE sur plusieurs distributions
    @Query("SELECT COUNT(DISTINCT i.personneId) FROM Inscription i "
        + "WHERE i.distributionId IN :distributionIds "
        + "AND i.type = 'BENEVOLE' AND i.statut = 'CONFIRMEE'")
    long compterBenevolesDistincts(@Param("distributionIds") List<UUID> distributionIds);

    @Modifying
    @Query("UPDATE Inscription i SET i.nom = :nom, i.prenom = :prenom WHERE i.personneId = :personneId")
    int remplacerNomPrenom(@Param("personneId") UUID personneId, @Param("nom") String nom,
                           @Param("prenom") String prenom);
}
