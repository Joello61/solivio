package com.solivio.api.shared.web;

import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;

/**
 * Nettoyage des textes saisis avant persistance (aucune balise HTML conservee) et
 * longueurs maximales des textes libres, alignees sur les colonnes TEXT.
 */
public final class Assainissement {

    /** Description d'une distribution, d'un evenement, d'une mission ou d'une session. */
    public static final int TEXTE_LONG_MAX = 2000;
    /** Motif ou raison d'une annulation. */
    public static final int MOTIF_MAX = 1000;

    private Assainissement() {
    }

    public static String nettoyer(String brut) {
        return brut == null ? null : Jsoup.clean(brut, Safelist.none());
    }
}
