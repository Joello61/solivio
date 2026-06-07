package com.solivio.api.inscription.infrastructure.persistence;

import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.TypeInscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InscriptionRepository extends JpaRepository<Inscription, UUID> {

    List<Inscription> findByDistributionIdOrderByNomAscPrenomAsc(UUID distributionId);

    List<Inscription> findByDistributionIdAndStatutOrderByNomAscPrenomAsc(
        UUID distributionId, StatutInscription statut
    );

    Optional<Inscription> findByDistributionIdAndPersonneIdAndType(
        UUID distributionId, UUID personneId, TypeInscription type
    );

    long countByDistributionIdAndTypeAndStatut(
        UUID distributionId, TypeInscription type, StatutInscription statut
    );

    long countByDistributionIdAndCreneauIdAndTypeAndStatut(
        UUID distributionId, UUID creneauId, TypeInscription type, StatutInscription statut
    );

    // Prochain en liste d'attente (rang le plus bas)
    Optional<Inscription> findFirstByDistributionIdAndTypeAndStatutOrderByRangListeAttenteAsc(
        UUID distributionId, TypeInscription type, StatutInscription statut
    );

    // Prochain en liste d'attente pour un creneau specifique
    Optional<Inscription> findFirstByDistributionIdAndCreneauIdAndTypeAndStatutOrderByRangListeAttenteAsc(
        UUID distributionId, UUID creneauId, TypeInscription type, StatutInscription statut
    );

    // Rang max en liste d'attente pour calculer le rang du nouvel inscrit
    @Query("SELECT MAX(i.rangListeAttente) FROM Inscription i "
        + "WHERE i.distributionId = :distId AND i.type = :type AND i.statut = 'LISTE_ATTENTE'")
    Optional<Integer> findMaxRangListeAttente(
        @Param("distId") UUID distributionId, @Param("type") TypeInscription type
    );

    // RG1 : frequence - inscriptions CONFIRMEE d'un beneficiaire sur une periode
    @Query("SELECT COUNT(i) FROM Inscription i "
        + "WHERE i.personneId = :personneId AND i.type = 'BENEFICIAIRE' "
        + "AND i.statut = 'CONFIRMEE' "
        + "AND i.dateInscription BETWEEN :debut AND :fin")
    long compterInscriptionsConfirmeesPeriode(
        @Param("personneId") UUID personneId,
        @Param("debut") Instant debut,
        @Param("fin") Instant fin
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
}
