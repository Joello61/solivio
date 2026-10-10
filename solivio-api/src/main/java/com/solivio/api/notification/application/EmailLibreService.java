package com.solivio.api.notification.application;

import com.solivio.api.notification.domain.CibleEmail;
import com.solivio.api.notification.domain.TypeEvenementNotification;
import com.solivio.api.notification.infrastructure.email.NotificationEmailException;
import com.solivio.api.notification.infrastructure.persistence.NotificationRepository;
import com.solivio.api.shared.identity.PersonneQueryPort;
import com.solivio.api.shared.identity.PersonneQueryPort.PersonneContactInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class EmailLibreService {

    private static final Logger log = LoggerFactory.getLogger(EmailLibreService.class);

    private final NotificationEmailService emailService;
    private final PersonneQueryPort personneQueryPort;
    private final NotificationRepository notificationRepository;

    public EmailLibreService(
        NotificationEmailService emailService,
        PersonneQueryPort personneQueryPort,
        NotificationRepository notificationRepository
    ) {
        this.emailService = emailService;
        this.personneQueryPort = personneQueryPort;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void envoyer(CibleEmail cible, String sujet, String corps) {
        List<PersonneContactInfo> destinataires = resoudreDestinataires(cible);
        Set<UUID> traites = new LinkedHashSet<>();
        for (PersonneContactInfo p : destinataires) {
            if (!traites.add(p.id())) {
                continue;
            }
            try {
                emailService.envoyerEmailLibre(p.email(), sujet, corps);
                notificationRepository.save(
                    com.solivio.api.notification.domain.Notification.envoye(
                        null, p.id(), null, TypeEvenementNotification.EMAIL_LIBRE, sujet));
                log.debug("Email libre envoye a la personne {}", p.id());
            } catch (NotificationEmailException e) {
                notificationRepository.save(
                    com.solivio.api.notification.domain.Notification.echec(
                        null, p.id(), null, TypeEvenementNotification.EMAIL_LIBRE, sujet, e.getMessage()));
                log.error("Echec email libre pour la personne {} : {}", p.id(), e.getMessage());
            }
        }
    }

    private List<PersonneContactInfo> resoudreDestinataires(CibleEmail cible) {
        return switch (cible) {
            case BENEVOLES      -> personneQueryPort.trouverContactsParRole("benevole");
            case BENEFICIAIRES  -> personneQueryPort.trouverContactsParRole("beneficiaire");
            case COORDINATEURS  -> personneQueryPort.trouverContactsParRole("coordinateur");
            case RESPONSABLES   -> personneQueryPort.trouverContactsParRole("responsable");
            case TOUS           -> {
                List<PersonneContactInfo> tous = new ArrayList<>();
                tous.addAll(personneQueryPort.trouverContactsParRole("benevole"));
                tous.addAll(personneQueryPort.trouverContactsParRole("beneficiaire"));
                tous.addAll(personneQueryPort.trouverContactsParRole("coordinateur"));
                tous.addAll(personneQueryPort.trouverContactsParRole("responsable"));
                yield tous;
            }
        };
    }
}
