package com.solivio.api.inscription.application;

import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.inscription.domain.Inscription;
import com.solivio.api.inscription.domain.StatutInscription;
import com.solivio.api.inscription.domain.StatutPresence;
import com.solivio.api.inscription.domain.TypeInscription;
import com.solivio.api.inscription.infrastructure.persistence.InscriptionRepository;
import com.solivio.api.inscription.infrastructure.persistence.PointageAdHocRepository;
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
    private final PersonneQueryPort personneQueryPort;
    private final PointageAdHocRepository pointageAdHocRepository;

    public InscriptionQueryAdapter(
        InscriptionRepository inscriptionRepository,
        PersonneQueryPort personneQueryPort,
        PointageAdHocRepository pointageAdHocRepository
    ) {
        this.inscriptionRepository = inscriptionRepository;
        this.personneQueryPort = personneQueryPort;
        this.pointageAdHocRepository = pointageAdHocRepository;
    }

    @Override
    public long compterPointages(UUID distributionId) {
        return inscriptionRepository.countByDistributionIdAndPresenceNot(distributionId, StatutPresence.NON_POINTE)
            + pointageAdHocRepository.countByDistributionId(distributionId);
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
        return destinataires(inscriptionRepository
            .findByDistributionIdAndStatutOrderByNomAscPrenomAsc(distributionId, StatutInscription.CONFIRMEE));
    }

    @Override
    public List<DestinataireMail> trouverInscritsActifs(UUID distributionId) {
        return destinataires(inscriptionRepository.findByDistributionIdAndStatutIn(
            distributionId, List.of(StatutInscription.CONFIRMEE, StatutInscription.LISTE_ATTENTE)));
    }

    @Override
    public int compterConfirmes(UUID distributionId, String typeInscription) {
        return (int) inscriptionRepository.countByDistributionIdAndTypeAndStatut(
            distributionId, TypeInscription.valueOf(typeInscription), StatutInscription.CONFIRMEE);
    }

    @Override
    public Map<UUID, ComptesCreneau> compterParCreneau(UUID distributionId) {
        return inscriptionRepository.compterParCreneau(distributionId).stream()
            .collect(Collectors.toMap(
                ligne -> (UUID) ligne[0],
                ligne -> new ComptesCreneau(((Number) ligne[1]).intValue(), ((Number) ligne[2]).intValue())));
    }

    private List<DestinataireMail> destinataires(List<Inscription> inscrits) {

        List<UUID> personneIds = inscrits.stream()
            .map(Inscription::getPersonneId)
            .distinct()
            .toList();

        // Batch : une seule requete pour tous les emails
        Map<UUID, String> emailParPersonne = personneQueryPort.trouverEmailsParIds(personneIds);

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
