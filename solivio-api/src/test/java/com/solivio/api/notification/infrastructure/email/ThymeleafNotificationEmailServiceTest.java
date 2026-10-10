package com.solivio.api.notification.infrastructure.email;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.IContext;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class ThymeleafNotificationEmailServiceTest {

    private static final String DESTINATAIRE = "marie.dupont@exemple.fr";

    // Le serveur SMTP cite le destinataire dans son refus : ni le journal ni le
    // message enregistre dans notification.erreur ne doivent le reprendre.
    @Test
    void echecSmtp_neJournaliseNiNeTransmetLAdresse(CapturedOutput sortie) {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        TemplateEngine templateEngine = mock(TemplateEngine.class);
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        when(templateEngine.process(anyString(), any(IContext.class))).thenReturn("<p>corps</p>");
        doThrow(new MailSendException("550 <" + DESTINATAIRE + ">: user unknown"))
            .when(mailSender).send(any(MimeMessage.class));
        ThymeleafNotificationEmailService service =
            new ThymeleafNotificationEmailService(mailSender, templateEngine, "noreply@solivio.fr");

        assertThatThrownBy(() -> service.envoyerEmailLibre(DESTINATAIRE, "Sujet", "corps"))
            .isInstanceOf(NotificationEmailException.class)
            .hasMessageContaining("MailSendException")
            .hasMessageNotContaining(DESTINATAIRE)
            .hasNoCause();
        assertThat(sortie.getAll()).contains("email-libre").doesNotContain(DESTINATAIRE);
    }
}
