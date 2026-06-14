package com.solivio.api.inscription.application;

import com.solivio.api.identity.domain.Personne;
import com.solivio.api.identity.infrastructure.persistence.PersonneRepository;
import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.shared.inscription.InscriptionQueryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class InscriptionQueryAdapter implements InscriptionQueryPort {

    private final InscriptionRepository inscriptionRepository;
    private final PersonneRepository personneRepository;

    public InscriptionQueryAdapter(
        InscriptionRepository inscriptionRepository,
        PersonneRepository personneRepository
    ) {
        this.inscriptionRepository = inscriptionRepository;
        this.personneRepository = personneRepository;
    }

    @Override
    public int compterBeneficiairesInscrits(UUID distributionId) {
        return (int) inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.BENEFICIAIRE, StatutInscription.CONFIRMEE
        );
    }

    @Override
    public int compterBeneficiairesPresents(UUID distributionId) {
        return (int) inscriptionRepository.compterBeneficiairesPresents(distributionId);
    }

    @Override
    public List<DestinataireMail> trouverInscritsConfirmes(UUID distributionId) {
        List<Inscription> inscrits = inscriptionRepository
            .findByDistributionIdAndStatutOrderByNomAscPrenomAsc(distributionId, StatutInscription.CONFIRMEE);

        List<UUID> personneIds = inscrits.stream()
            .map(Inscription::getPersonneId)
            .distinct()
            .toList();

        // Batch : une seule requete pour tous les emails
        Map<UUID, String> emailParPersonne = personneRepository.findAllById(personneIds)
            .stream()
            .collect(Collectors.toMap(Personne::getId,
                Personne::getEmail));

        return inscrits.stream()
            .filter(i -> emailParPersonne.containsKey(i.getPersonneId()))
            .map(i -> new DestinataireMail(
                i.getPersonneId(),
                emailParPersonne.get(i.getPersonneId()),
                i.getPrenom(),
                i.getType().name(),
                i.getCreneauId()
            ))
            .toList();
    }
}
