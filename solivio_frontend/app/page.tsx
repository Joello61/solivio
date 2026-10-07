"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ShieldCheck,
  Database,
  HeartHandshake,
  Calendar,
  Lock,
  RefreshCw,
  ChevronDown,
  Menu,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  ClipboardCheck,
  UserCheck,
  Mail,
  GitBranch,
  Globe,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const MOCK_BENEFICIARIES = [
  { prenom: "Amara", creneau: "10h00", statut: "present" },
  { prenom: "Lucas", creneau: "10h00", statut: "present" },
  { prenom: "Inès", creneau: "10h15", statut: "present" },
  { prenom: "Théo", creneau: "10h15", statut: "absent" },
  { prenom: "Fatou", creneau: "10h30", statut: "present" },
  { prenom: "Mathieu", creneau: "10h30", statut: "present" },
  { prenom: "Yasmine", creneau: "10h45", statut: "en attente" },
  { prenom: "Romain", creneau: "10h45", statut: "en attente" },
];

function CheckinWidget() {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < MOCK_BENEFICIARIES.length - 2) {
        setActiveIndex(i);
        i++;
      } else {
        clearInterval(id);
      }
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full max-w-120 mx-auto lg:mx-0 lg:ml-auto">
      <div className="absolute -inset-4 bg-teal-500/10 dark:bg-teal-500/6 rounded-3xl blur-2xl pointer-events-none" />
      <div className="relative border border-border bg-card rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/60">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground tracking-wider">
            Pointage - 15 juin 2026
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/12 px-2 py-0.5 rounded-full border border-teal-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            En direct
          </span>
        </div>

        <div className="grid grid-cols-[1fr_80px_90px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 border-b border-border/40">
          <span>Prénom</span>
          <span className="text-center">Créneau</span>
          <span className="text-center">Statut</span>
        </div>

        <div className="divide-y divide-border/30">
          {MOCK_BENEFICIARIES.map((b, i) => {
            const isActive = i === activeIndex;
            const isPast = i < activeIndex;
            return (
              <div
                key={i}
                className={`grid grid-cols-[1fr_80px_90px] gap-2 px-4 py-2.5 items-center text-sm transition-colors duration-300 ${
                  isActive ? "bg-teal-500/8 dark:bg-teal-500/5" : ""
                }`}
              >
                <span className={`font-semibold transition-colors duration-300 ${isActive ? "text-teal-700 dark:text-teal-300" : "text-foreground"}`}>
                  {b.prenom}
                </span>
                <span className="flex items-center justify-center gap-1 text-[11px] font-mono text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {b.creneau}
                </span>
                <span className="flex justify-center">
                  {b.statut === "present" && isPast ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Présent
                    </span>
                  ) : b.statut === "absent" && isPast ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-red-500 dark:text-red-400">
                      <XCircle className="h-3.5 w-3.5" />
                      Absent
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">en attente</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground font-mono">
            {Math.max(0, activeIndex)} / {MOCK_BENEFICIARIES.length} pointés
          </span>
          <span className="text-[11px] text-muted-foreground/50 font-medium">
            Données pseudonymisées - RGPD
          </span>
        </div>
      </div>
    </div>
  );
}

function RepartitionSimulator() {
  const [count, setCount] = useState(180);
  const stocks = { carottes: 300, pates: 200, lait: 240 };
  const calcul = {
    carottes: (stocks.carottes / count).toFixed(2),
    pates: Math.floor(stocks.pates / count),
    lait: Math.floor(stocks.lait / count),
    restesPates: stocks.pates % count,
    restesLait: stocks.lait % count,
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-sm">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/40">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Calcul de dotation
        </span>
        <span className="text-xs font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20 font-bold">
          {count} inscrits
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Nombre de bénéficiaires
            </label>
            <span className="text-sm font-bold font-mono text-foreground">{count}</span>
          </div>
          <input
            type="range"
            min="80"
            max="300"
            step="1"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-primary h-1.5"
          />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
            <span>80</span>
            <span>190</span>
            <span>300</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Carottes", val: `${calcul.carottes} kg`, bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900/40" },
            { label: "Pâtes", val: `${calcul.pates} pqt`, bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/40" },
            { label: "Lait", val: `${calcul.lait} bq`, bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/40" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border p-3 text-center ${item.bg}`}>
              <div className="text-base font-mono font-extrabold text-foreground">{item.val}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide font-bold">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Non distribués
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {calcul.restesPates} pqt pâtes - {calcul.restesLait} bq lait
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({ 0: true });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoggedIn(document.cookie.includes("access_token"));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleFaq = (i: number) =>
    setFaqOpen((prev) => ({ ...prev, [i]: !prev[i] }));

  const navLinks = [
    { label: "Le problème", href: "#probleme", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    { label: "Fonctionnalités", href: "#fonctions", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { label: "Engagements", href: "#philosophie", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { label: "FAQ", href: "#faq", icon: <HelpCircle className="h-3.5 w-3.5" /> },
    { label: "Contact", href: "#contact", icon: <Mail className="h-3.5 w-3.5" /> },
  ];

  const faqItems = [
    {
      q: "Solivio est-il gratuit pour notre association ?",
      a: "Oui. La plateforme est gratuite pour les petites et moyennes structures. Le code source est publié sous licence AGPL-3.0 et vous pouvez l'héberger sur vos propres serveurs.",
    },
    {
      q: "Comment sont protégées les données des bénéficiaires ?",
      a: "La confidentialité est intégrée dès la conception. Les bénévoles au pointage ne voient que le prénom et le créneau. Les statistiques de fin de distribution sont agrégées et pseudonymisées. Aucun hébergement hors Union européenne.",
    },
    {
      q: "Notre fonctionnement avec des créneaux horaires est-il compatible ?",
      a: "Oui. Solivio permet de configurer une distribution avec un seul créneau ou plusieurs créneaux successifs pour lisser l'affluence et préserver la discrétion.",
    },
    {
      q: "Le renouvellement annuel du bureau pose-t-il un problème ?",
      a: "C'est précisément le problème que Solivio résout. La base de données est centralisée et structurée pour que le nouveau bureau prenne les rênes sans perdre l'historique.",
    },
    {
      q: "Qui peut voir les données sensibles des bénéficiaires ?",
      a: "Uniquement les rôles qui en ont besoin. Le profil social d'un bénéficiaire n'apparaît jamais au pointage, et les statistiques sont toujours agrégées et pseudonymisées.",
    },
    {
      q: "Puis-je exporter mes données à tout moment ?",
      a: "Oui, sans restriction. Vos listes d'inscrits et de membres sont exportables en un clic au format CSV ou Excel. Vous restez propriétaire de vos données.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased">

      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-8 w-8 rounded-xl bg-teal-600 flex items-center justify-center shadow-sm group-hover:bg-teal-700 transition-colors">
                <Image src="/logo.svg" alt="" width={18} height={18} />
              </div>
              <span className="font-display font-bold text-base tracking-tight text-foreground">
                Solivio
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ label, href, icon }) => (
                <a
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-all duration-150"
                >
                  {icon}
                  {label}
                </a>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Se connecter
              </Button>
            </Link>
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              <Button variant="default" size="sm" className="text-sm font-medium shadow-sm">
                {isLoggedIn ? "Tableau de bord" : "Créer un espace"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background px-4 py-4 space-y-1 animate-slide-down-fade">
            {navLinks.map(({ label, href, icon }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {icon}
                {label}
              </a>
            ))}
            <div className="pt-3 border-t border-border mt-3 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Se connecter</Button>
              </Link>
              <Link href={isLoggedIn ? "/dashboard" : "/register"} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" className="w-full">
                  {isLoggedIn ? "Tableau de bord" : "Créer un espace"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, oklch(0.747 0.018 264) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.18,
          }}
        />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            <div className="space-y-7 animate-slide-up-fade">
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl xl:text-[3.5rem] tracking-tight text-foreground leading-[1.07]">
                Gérez vos distributions alimentaires{" "}
                <span className="text-teal-600 dark:text-teal-400">
                  sans perdre de données.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
                Solivio remplace les tableurs éphémères. Un outil pensé pour la confidentialité des bénéficiaires, la passation d&apos;équipe et le pointage sur le terrain.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link href={isLoggedIn ? "/dashboard" : "/register"}>
                  <Button size="lg" className="w-full sm:w-auto text-sm font-semibold shadow-sm">
                    {isLoggedIn ? "Accéder à l'espace" : "Créer le portail association"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm font-semibold">
                    Rejoindre un espace existant
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                {[
                  ["AGPL-3.0", "Open source"],
                  ["RGPD", "Données EU"],
                  ["100% gratuit", "Associations"],
                ].map(([val, label]) => (
                  <div key={val} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{val}</span>{" "}
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <CheckinWidget />
          </div>
        </div>
      </section>

      {/* PROBLEME */}
      <section id="probleme" className="py-20 border-b border-border scroll-mt-14 bg-neutral-50 dark:bg-neutral-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3">
              Le constat
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground leading-tight">
              Pourquoi le tableur détruit la continuité associative
            </h2>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
            <div className="grid grid-cols-[2fr_3fr_3fr] border-b border-border">
              <div className="px-5 py-3" />
              <div className="px-5 py-3 border-l border-border">
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-500 dark:text-red-400">
                  Fichier tableur
                </span>
              </div>
              <div className="px-5 py-3 border-l border-border">
                <span className="text-[11px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                  Solivio
                </span>
              </div>
            </div>

            {[
              {
                sujet: "Passation en mai",
                tableur: "Base perdue ou corrompue. Le nouveau bureau repart de zéro.",
                solivio: "Historique centralisé. Le bureau entrant prend les clés en 5 min.",
                icon: <RefreshCw className="h-4 w-4 shrink-0 text-muted-foreground" />,
              },
              {
                sujet: "Pointage le jour J",
                tableur: "Les bénévoles consultent les dossiers complets avec les coordonnées.",
                solivio: "Interface restreinte : prénom et créneau uniquement. Rien d'autre.",
                icon: <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />,
              },
              {
                sujet: "Files d'attente",
                tableur: "Attente visible devant le gymnase, stigmatisante pour les étudiants.",
                solivio: "Créneaux horaires configurables. Passage échelonné, dignité préservée.",
                icon: <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />,
              },
              {
                sujet: "Conformité RGPD",
                tableur: "Données personnelles dans des fichiers partagés sans contrôle.",
                solivio: "Données hébergées en UE. Exports à la demande. Accès journalisés.",
                icon: <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />,
              },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-[2fr_3fr_3fr] border-b border-border/50 last:border-0">
                <div className="px-5 py-4 flex items-center gap-2.5 border-r border-border/40">
                  {row.icon}
                  <span className="text-sm font-semibold text-foreground">{row.sujet}</span>
                </div>
                <div className="px-5 py-4 text-sm text-muted-foreground border-r border-border/40 leading-relaxed">
                  <span className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    {row.tableur}
                  </span>
                </div>
                <div className="px-5 py-4 text-sm text-foreground leading-relaxed bg-teal-500/[0.03] dark:bg-teal-500/[0.06]">
                  <span className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    {row.solivio}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNALITES */}
      <section id="fonctions" className="py-20 border-b border-border scroll-mt-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3">
              Ce que ça résout
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground leading-tight">
              Un outil, trois acteurs, zéro friction
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                badge: "Coordinateurs",
                icon: <LayoutDashboard className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
                color: "teal",
                title: "Planifier sans tableur",
                desc: "Créez les distributions, configurez les créneaux, affectez les dotations. L'historique reste même quand le bureau change.",
                footer: "Gestion opérationnelle",
              },
              {
                badge: "Bénévoles",
                icon: <ClipboardCheck className="h-5 w-5 text-coral-600 dark:text-coral-400" />,
                color: "coral",
                title: "Pointer en confiance",
                desc: "Interface tablette avec seulement le prénom. Aucun document social visible. Le pointage prend 2 secondes par personne.",
                footer: "Pointage sur tablette",
              },
              {
                badge: "Bénéficiaires",
                icon: <UserCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
                color: "teal",
                title: "S'inscrire discrètement",
                desc: "Inscription rapide au créneau souhaité, sans créer de compte ni de mot de passe. Confirmation par e-mail automatique.",
                footer: "Discrétion et autonomie",
              },
            ].map((card, i) => (
              <div
                key={i}
                className="group border border-border rounded-2xl p-6 bg-card flex flex-col justify-between hover:border-teal-500/30 hover:shadow-md transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-widest rounded-md px-2 py-1 ${
                        card.color === "teal"
                          ? "bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20"
                          : "bg-coral-500/10 text-coral-700 dark:text-coral-400 border border-coral-500/20"
                      }`}
                    >
                      {card.badge}
                    </span>
                    <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center group-hover:bg-teal-500/10 transition-colors">
                      {card.icon}
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground leading-snug">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-sm font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform duration-150">
                  {card.footer}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATION */}
      <section id="simulation" className="py-20 border-b border-border scroll-mt-14 bg-teal-50/40 dark:bg-teal-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                Répartition des denrées
              </p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground leading-tight">
                La dotation calculée{" "}
                <span className="text-teal-600 dark:text-teal-400">au panier près.</span>
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Entrez vos stocks. Solivio calcule instantanément la dotation par bénéficiaire inscrit en minimisant le gaspillage et les inégalités entre créneaux.
              </p>
              <ul className="space-y-3 pt-1">
                {[
                  "Stocks saisis une seule fois avant la distribution",
                  "Dotation mise à jour si des inscrits s'ajoutent",
                  "Restants identifiés pour redistribution ou don",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <RepartitionSimulator />
          </div>
        </div>
      </section>

      {/* PHILOSOPHIE */}
      <section id="philosophie" className="py-20 border-b border-border scroll-mt-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3">
              Nos engagements
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground leading-tight">
              Aucun verrouillage. Aucune dépendance.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: <Database className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
                title: "Instance dédiée",
                desc: "Solivio est déployé pour Linkee Toulouse sur sa propre base de données, partagée avec aucune autre structure.",
              },
              {
                icon: <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
                title: "Confidentialité by design",
                desc: "Aucune donnée sociale transmise au-delà du strict nécessaire. Les bénévoles ne voient jamais les dossiers complets.",
              },
              {
                icon: <HeartHandshake className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
                title: "Export libre, toujours",
                desc: "Exportez vos listes d'inscrits et membres en un clic. Vous restez propriétaire de vos données, à tout moment.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="border border-border rounded-2xl p-6 bg-card space-y-4 hover:border-teal-500/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  {card.icon}
                </div>
                <h3 className="font-display font-bold text-base text-foreground">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {[
              { icon: <GitBranch className="h-3.5 w-3.5" />, label: "AGPL-3.0 open source" },
              { icon: <Globe className="h-3.5 w-3.5" />, label: "Hébergement Union Européenne" },
              { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Conforme RGPD" },
              { icon: <Database className="h-3.5 w-3.5" />, label: "Instance dédiée" },
            ].map((b) => (
              <span
                key={b.label}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground border border-border rounded-full px-3 py-1.5 bg-muted/40"
              >
                {b.icon}
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - 2 colonnes independantes */}
      <section id="faq" className="py-20 border-b border-border scroll-mt-14 bg-neutral-50 dark:bg-neutral-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-3">
              FAQ
            </p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground">
              Questions fréquentes
            </h2>
          </div>

          <div className="hidden md:flex gap-3 items-start">
            {[faqItems.slice(0, 3), faqItems.slice(3)].map((col, ci) => (
              <div key={ci} className="flex-1 flex flex-col gap-3">
                {col.map((item, ri) => {
                  const i = ci === 0 ? ri : ri + 3;
                  return (
                    <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleFaq(i)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors gap-4"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                            faqOpen[i] ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {faqOpen[i] && (
                        <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex md:hidden flex-col gap-3">
            {faqItems.map((item, i) => (
              <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors gap-4"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                      faqOpen[i] ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {faqOpen[i] && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 border-b border-border scroll-mt-14 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                Nous contacter
              </p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight text-foreground leading-tight">
                Une question sur Solivio ?
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Que vous souhaitiez tester la plateforme, signaler un bug ou contribuer au projet, nous sommes disponibles.
              </p>

              <div className="space-y-3 pt-2">
                <a
                  href="mailto:contact@solivio.org"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-teal-500/30 hover:bg-teal-500/[0.02] transition-all duration-150 group"
                >
                  <div className="h-9 w-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">E-mail général</p>
                    <p className="text-xs text-muted-foreground">contact@solivio.org</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </a>

                <a
                  href="https://github.com/Joello61/solivio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-teal-500/30 hover:bg-teal-500/[0.02] transition-all duration-150 group"
                >
                  <div className="h-9 w-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <GitBranch className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Code source sur GitHub</p>
                    <p className="text-xs text-muted-foreground">github.com/Joello61/solivio</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </a>
              </div>
            </div>

            <div className="border border-border rounded-2xl p-6 bg-card shadow-sm">
              <h3 className="font-display font-bold text-lg text-foreground mb-5">Envoyer un message</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prénom</label>
                    <input
                      type="text"
                      placeholder="Jean"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nom</label>
                    <input
                      type="text"
                      placeholder="Dupont"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
                  <input
                    type="email"
                    placeholder="jean.dupont@asso.fr"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Décrivez votre besoin ou votre question..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all resize-none"
                  />
                </div>
                <Button className="w-full font-semibold shadow-sm">
                  Envoyer le message
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 scroll-mt-14" style={{ backgroundColor: "oklch(0.447 0.098 185)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white leading-[1.1]">
            Prêt à structurer vos prochaines distributions ?
          </h2>
          <p className="text-white/70 text-base leading-relaxed max-w-xl mx-auto">
            Déployez Solivio gratuitement pour votre association. Aucune carte bancaire, aucune condition cachée.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link href={isLoggedIn ? "/dashboard" : "/register"}>
              <Button variant="accent" size="lg" className="w-full sm:w-auto text-sm font-semibold">
                {isLoggedIn ? "Accéder à mon espace" : "Créer le compte association"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm font-semibold text-white border-white/30 bg-transparent hover:bg-white/10 hover:border-white/50"
              >
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-teal-600 flex items-center justify-center">
              <Image src="/logo.svg" alt="" width={16} height={16} />
            </div>
            <span className="font-display font-bold text-sm text-foreground">Solivio</span>
          </Link>

          <p className="text-xs text-muted-foreground text-center">
            Logiciel open source sous licence GNU AGPL-3.0 - Hébergement Union Européenne
          </p>

          <p className="text-xs text-muted-foreground font-medium">
            Timothée Joël Tchinda Tchoffo
          </p>
        </div>
      </footer>

    </div>
  );
}