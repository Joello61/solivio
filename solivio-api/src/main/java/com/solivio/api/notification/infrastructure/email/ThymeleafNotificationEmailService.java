package com.solivio.api.notification.infrastructure.email;

import com.solivio.api.notification.application.NotificationEmailService;
import com.solivio.api.notification.application.NotificationEmailService.ContexteCollecteEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteEvenementEmail;
import com.solivio.api.notification.application.NotificationEmailService.ContexteReconditionnementEmail;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class ThymeleafNotificationEmailService implements NotificationEmailService {

    private static final Logger log = LoggerFactory.getLogger(ThymeleafNotificationEmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String fromAddress;

    public ThymeleafNotificationEmailService(
        JavaMailSender mailSender,
        TemplateEngine templateEngine,
        @Value("${solivio.mail.from}") String fromAddress
    ) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.fromAddress = fromAddress;
    }

    @Override
    public void envoyerConfirmationInscription(String email, ContexteEmail contexte) {
        envoyer(email, "Votre inscription est confirmee - " + contexte.distribution().titre(),
            "confirmation-inscription", contexteThymeleaf(contexte));
    }

    @Override
    public void envoyerPromotionListeAttente(String email, ContexteEmail contexte) {
        envoyer(email, "Une place est disponible - " + contexte.distribution().titre(),
            "promotion-liste-attente", contexteThymeleaf(contexte));
    }

    @Override
    public void envoyerAnnulationDistribution(String email, ContexteEmail contexte) {
        envoyer(email, "Distribution annulee - " + contexte.distribution().titre(),
            "annulation-distribution", contexteThymeleaf(contexte));
    }

    @Override
    public void envoyerRappelVeille(String email, ContexteEmail contexte) {
        envoyer(email, "Rappel : distribution demain - " + contexte.distribution().titre(),
            "rappel-veille", contexteThymeleaf(contexte));
    }

    @Override
    public void envoyerDesistementTardifBenevole(
        String emailCoordinateur, String prenomCoordinateur,
        String prenomBenevole, String nomBenevole,
        com.solivio.api.shared.distribution.DistributionQueryPort.DistributionDetailInfo distribution
    ) {
        Context ctx = new Context(Locale.FRENCH);
        ctx.setVariable("prenomCoordinateur", prenomCoordinateur);
        ctx.setVariable("prenomBenevole", prenomBenevole);
        ctx.setVariable("nomBenevole", nomBenevole);
        ctx.setVariable("distributionTitre", distribution.titre());
        ctx.setVariable("distributionDate", distribution.date());
        ctx.setVariable("distributionLieu", distribution.lieu());
        envoyer(emailCoordinateur,
            "Desistement tardif benevole - " + distribution.titre(),
            "desistement-tardif-benevole", ctx);
    }

    @Override
    public void envoyerConfirmationInscriptionReconditionnement(
        String email, ContexteReconditionnementEmail contexte
    ) {
        envoyer(email, "Inscription confirmee - " + contexte.sessionTitre(),
            "confirmation-inscription-reconditionnement", contexteReconditionnementThymeleaf(contexte));
    }

    @Override
    public void envoyerAnnulationSessionReconditionnement(
        String email, ContexteReconditionnementEmail contexte
    ) {
        envoyer(email, "Session annulee - " + contexte.sessionTitre(),
            "annulation-session-reconditionnement", contexteReconditionnementThymeleaf(contexte));
    }

    @Override
    public void envoyerCreationMissionCollecte(String email, ContexteCollecteEmail contexte) {
        envoyer(email, "Nouvelle mission de collecte - " + contexte.missionTitre(),
            "creation-mission-collecte", contexteCollecteThymeleaf(contexte));
    }

    @Override
    public void envoyerAnnulationMissionCollecte(String email, ContexteCollecteEmail contexte) {
        envoyer(email, "Mission annulee - " + contexte.missionTitre(),
            "annulation-mission-collecte", contexteCollecteThymeleaf(contexte));
    }

    @Override
    public void envoyerPublicationEvenement(String email, ContexteEvenementEmail contexte) {
        envoyer(email, "Nouvel evenement - " + contexte.evenementTitre(),
            "creation-evenement", contexteEvenementThymeleaf(contexte));
    }

    @Override
    public void envoyerAnnulationEvenement(String email, ContexteEvenementEmail contexte) {
        envoyer(email, "Evenement annule - " + contexte.evenementTitre(),
            "annulation-evenement", contexteEvenementThymeleaf(contexte));
    }

    @Override
    public void envoyerEmailLibre(String email, String sujet, String corps) {
        Context ctx = new Context(Locale.FRENCH);
        ctx.setVariable("corps", corps);
        envoyer(email, sujet, "email-libre", ctx);
    }

    private Context contexteEvenementThymeleaf(ContexteEvenementEmail c) {
        Context ctx = new Context(Locale.FRENCH);
        ctx.setVariable("prenom", c.prenom());
        ctx.setVariable("evenementTitre", c.evenementTitre());
        ctx.setVariable("dateHeureDebut", c.dateHeureDebut());
        ctx.setVariable("lieuAdresseFormatee", c.lieuAdresseFormatee());
        ctx.setVariable("raisonAnnulation", c.raisonAnnulation());
        return ctx;
    }

    private Context contexteCollecteThymeleaf(ContexteCollecteEmail c) {
        Context ctx = new Context(Locale.FRENCH);
        ctx.setVariable("prenom", c.prenom());
        ctx.setVariable("missionTitre", c.missionTitre());
        ctx.setVariable("dateHeure", c.dateHeure());
        ctx.setVariable("lieuCollecteAdresse", c.lieuCollecteAdresse());
        ctx.setVariable("lieuDepotAdresse", c.lieuDepotAdresse());
        ctx.setVariable("raisonAnnulation", c.raisonAnnulation());
        return ctx;
    }

    private Context contexteReconditionnementThymeleaf(ContexteReconditionnementEmail c) {
        Context ctx = new Context(Locale.FRENCH);
        ctx.setVariable("prenom", c.prenom());
        ctx.setVariable("sessionTitre", c.sessionTitre());
        ctx.setVariable("dateHeureDebut", c.dateHeureDebut());
        ctx.setVariable("dateHeureFin", c.dateHeureFin());
        ctx.setVariable("sessionLieu", c.sessionLieu());
        ctx.setVariable("motifAnnulation", c.motifAnnulation());
        return ctx;
    }

    private Context contexteThymeleaf(ContexteEmail c) {
        Context ctx = new Context(Locale.FRENCH);
        ctx.setVariable("prenom", c.prenom());
        ctx.setVariable("estBenevole", c.estBenevole());
        ctx.setVariable("creneauHeureDebut", c.heureDebutCreneau());
        ctx.setVariable("creneauHeureFin", c.heureFinCreneau());
        ctx.setVariable("heureArriveeBenevole", c.heureArriveeBenevole());
        ctx.setVariable("distributionTitre", c.distribution().titre());
        ctx.setVariable("distributionDate", c.distribution().date());
        ctx.setVariable("distributionLieu", c.distribution().lieu());
        ctx.setVariable("motifAnnulation", c.distribution().motifAnnulation());
        return ctx;
    }

    private void envoyer(String destinataire, String sujet, String template, Context ctx) {
        try {
            String corps = templateEngine.process(template, ctx);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                StandardCharsets.UTF_8.name());
            helper.setFrom(fromAddress);
            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(corps, true);
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            log.error("Echec envoi email a {} ({}): {}", destinataire, sujet, e.getMessage());
            throw new NotificationEmailException(destinataire, sujet, e);
        }
    }
}
