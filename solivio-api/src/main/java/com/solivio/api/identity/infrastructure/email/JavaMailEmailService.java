package com.solivio.api.identity.infrastructure.email;

import com.solivio.api.identity.domain.Compte;
import com.solivio.api.identity.domain.Invitation;
import com.solivio.api.shared.association.AssociationQueryPort;
import com.solivio.api.shared.journal.DonneesPersonnelles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Envoi des emails transactionnels via Thymeleaf + JavaMailSender.
 * Les templates sont dans resources/templates/email/.
 */
@Service
public class JavaMailEmailService implements com.solivio.api.identity.application.EmailService {

    private static final Logger log = LoggerFactory.getLogger(JavaMailEmailService.class);

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final String fromAddress;
    private final String appUrl;
    private final AssociationQueryPort associationQueryPort;

    public JavaMailEmailService(
            JavaMailSender mailSender,
            TemplateEngine templateEngine,
            @Value("${solivio.mail.from}") String fromAddress,
            @Value("${solivio.auth.post-login-redirect-uri}") String appUrl,
            AssociationQueryPort associationQueryPort) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
        this.fromAddress = fromAddress;
        this.appUrl = appUrl;
        this.associationQueryPort = associationQueryPort;
    }

    @Override
    public void envoyerBienvenue(Compte compte) {
        Context ctx = nouveauContext();
        ctx.setVariable("prenom", compte.getPrenom());
        ctx.setVariable("appUrl", appUrl);
        envoyer(compte.getEmail(), "Bienvenue sur Solivio", "welcome", ctx);
    }

    @Override
    public void envoyerVerificationEmail(Compte compte, String code) {
        Context ctx = nouveauContext();
        ctx.setVariable("prenom", compte.getPrenom());
        ctx.setVariable("code", code);
        envoyer(compte.getEmail(), "Vérifiez votre email - Solivio", "email-verification", ctx);
    }

    @Override
    public void envoyerResetMotDePasse(Compte compte, String code) {
        Context ctx = nouveauContext();
        ctx.setVariable("prenom", compte.getPrenom());
        ctx.setVariable("code", code);
        envoyer(compte.getEmail(), "Réinitialisation de mot de passe - Solivio", "password-reset", ctx);
    }

    @Override
    public void envoyerConfirmationChangementMotDePasse(Compte compte) {
        Context ctx = nouveauContext();
        ctx.setVariable("prenom", compte.getPrenom());
        envoyer(compte.getEmail(), "Votre mot de passe a été modifié - Solivio", "password-changed", ctx);
    }

    @Override
    public void envoyerInvitation(Invitation invitation) {
        Context ctx = nouveauContext();
        String associationNom = associationQueryPort.nomAssociation();
        ctx.setVariable("associationNom", associationNom);
        ctx.setVariable("role", invitation.getRole());
        ctx.setVariable("inviteParPrenom", invitation.getInvitePar().getPrenom());
        ctx.setVariable("lienInscription",
            appUrl + "/register?invitation=" + invitation.getToken());
        envoyer(invitation.getEmail(),
            "Invitation a rejoindre " + associationNom + " - Solivio",
            "invitation", ctx);
    }

    @Override
    public void envoyerLienInscription(String email) {
        Context ctx = nouveauContext();
        String associationNom = associationQueryPort.nomAssociation();
        ctx.setVariable("associationNom", associationNom);
        ctx.setVariable("lienInscription", appUrl + "/register");
        envoyer(email, "Rejoindre " + associationNom + " - Solivio", "lien-inscription", ctx);
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
        } catch (MessagingException | org.springframework.mail.MailException e) {
            log.error("Echec envoi du template {} : {}", template, DonneesPersonnelles.resumerErreur(e));
        } catch (Exception e) {
            log.error("Erreur inattendue lors de l'envoi du template {} : {}", template,
                DonneesPersonnelles.resumerErreur(e));
        }
    }

    private Context nouveauContext() {
        Context ctx = new Context(Locale.FRENCH);
        ctx.setVariable("appUrl", appUrl);
        return ctx;
    }
}
