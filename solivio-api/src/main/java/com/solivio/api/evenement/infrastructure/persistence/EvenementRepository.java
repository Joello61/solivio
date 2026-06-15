package com.solivio.api.evenement.infrastructure.persistence;

import com.solivio.api.evenement.domain.Evenement;
import com.solivio.api.evenement.domain.StatutEvenement;
import com.solivio.api.evenement.domain.TypeEvenement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EvenementRepository extends JpaRepository<Evenement, UUID> {

    List<Evenement> findAllByOrderByDateHeureDebutAsc();

    List<Evenement> findByStatutOrderByDateHeureDebutAsc(StatutEvenement statut);

    List<Evenement> findByTypeOrderByDateHeureDebutAsc(TypeEvenement type);

    List<Evenement> findByStatutAndTypeOrderByDateHeureDebutAsc(StatutEvenement statut, TypeEvenement type);
}
