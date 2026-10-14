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

import java.util.Collection;
import java.util.HashMap;
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

    @Override
    public Map<UUID, Remplissage> compterRemplissage(Collection<UUID> distributionIds) {
        if (distributionIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, Remplissage> parDistribution = new HashMap<>();
        for (Object[] ligne : inscriptionRepository.compterRemplissage(distributionIds)) {
            parDistribution.merge((UUID) ligne[0], remplissageDeLigne(ligne), InscriptionQueryAdapter::cumuler);
        }
        return parDistribution;
    }

    private static Remplissage remplissageDeLigne(Object[] ligne) {
        UUID creneauId = (UUID) ligne[1];
        boolean beneficiaire = ligne[2] == TypeInscription.BENEFICIAIRE;
        boolean confirmee = ligne[3] == StatutInscription.CONFIRMEE;
        int nombre = ((Number) ligne[4]).intValue();
        int confirmes = confirmee ? nombre : 0;
        int enAttente = confirmee ? 0 : nombre;
        // La capacite d'un creneau ne vise que les beneficiaires (RG3).
        Map<UUID, RemplissageCreneau> parCreneau = beneficiaire && creneauId != null
            ? Map.of(creneauId, new RemplissageCreneau(confirmes, enAttente))
            : Map.of();
        return beneficiaire
            ? new Remplissage(confirmes, enAttente, 0, 0, parCreneau)
            : new Remplissage(0, 0, confirmes, enAttente, parCreneau);
    }

    private static Remplissage cumuler(Remplissage a, Remplissage b) {
        Map<UUID, RemplissageCreneau> parCreneau = new HashMap<>(a.parCreneau());
        b.parCreneau().forEach((id, c) -> parCreneau.merge(id, c, (x, y) ->
            new RemplissageCreneau(x.confirmes() + y.confirmes(), x.enAttente() + y.enAttente())));
        return new Remplissage(
            a.beneficiairesConfirmes() + b.beneficiairesConfirmes(),
            a.beneficiairesEnAttente() + b.beneficiairesEnAttente(),
            a.benevolesConfirmes() + b.benevolesConfirmes(),
            a.benevolesEnAttente() + b.benevolesEnAttente(),
            parCreneau);
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
