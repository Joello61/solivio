package com.solivio.api.shared.journal;

import java.util.regex.Pattern;

/**
 * Les messages d'erreur SMTP citent souvent le destinataire ("550 marie@x.fr: user unknown") :
 * on les masque avant de les journaliser ou de les enregistrer.
 */
public final class DonneesPersonnelles {

    private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+");
    private static final String MASQUE = "[email masque]";

    private DonneesPersonnelles() {
    }

    public static String masquerEmails(String texte) {
        if (texte == null) {
            return null;
        }
        return EMAIL.matcher(texte).replaceAll(MASQUE);
    }

    /** Classe de l'exception et message masque, sans la cause complete. */
    public static String resumerErreur(Throwable erreur) {
        String message = masquerEmails(erreur.getMessage());
        String type = erreur.getClass().getSimpleName();
        return message == null ? type : type + " : " + message;
    }
}
