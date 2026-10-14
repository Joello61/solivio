"use client";

import { useState } from "react";
import { MapPin, Pencil, Trash2, XCircle } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Billet, actionBillet } from "@/components/ui/billet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Jauge } from "@/components/ui/jauge";
import { List, ListRow } from "@/components/ui/list-row";
import { PageHeader } from "@/components/ui/page-header";
import { Rail } from "@/components/ui/rail";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Stat } from "@/components/ui/stat";
import { Statut } from "@/components/ui/statut";
import { Textarea } from "@/components/ui/textarea";
import { STATUT_DISTRIBUTION, STATUT_INSCRIPTION, STATUT_PRESENCE } from "@/lib/libelles";

type Filtre = "venir" | "brouillons" | "passees";

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">{titre}</h2>
      {children}
    </section>
  );
}

export function Catalogue() {
  const [filtre, setFiltre] = useState<Filtre>("venir");
  const [recherche, setRecherche] = useState("");

  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        surtitre="Solivio"
        titre="Système de design"
        description="Les primitives de l'interface, dans leurs états courants."
        actions={
          <>
            <Button>Action principale</Button>
            <ActionMenu
              items={[
                { label: "Modifier", icon: Pencil },
                { label: "Annuler la distribution", icon: XCircle, destructive: true },
              ]}
            />
          </>
        }
      />

      <Section titre="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Publier</Button>
          <Button variant="outline">Modifier</Button>
          <Button variant="secondary">Dupliquer</Button>
          <Button variant="accent">Ouvrir le jour J</Button>
          <Button variant="ghost">Plus tard</Button>
          <Button variant="destructive">Retirer</Button>
          <Button variant="destructive-solid">Confirmer la suppression</Button>
          <Button disabled>Indisponible</Button>
          <Button size="sm" variant="outline">Petit</Button>
          <Button size="xl">Jour J</Button>
        </div>
      </Section>

      <Section titre="Statuts">
        <div className="flex flex-wrap gap-2">
          {Object.values(STATUT_DISTRIBUTION).map((l) => <Statut key={l.texte} libelle={l} />)}
          {Object.values(STATUT_INSCRIPTION).map((l) => <Statut key={`i-${l.texte}`} libelle={l} />)}
          {Object.values(STATUT_PRESENCE).map((l) => <Statut key={`p-${l.texte}`} libelle={l} />)}
          <Statut libelle={STATUT_INSCRIPTION.LISTE_ATTENTE} detail="rang 3" />
          <Badge variant="info">Information</Badge>
        </div>
      </Section>

      <Section titre="Filtres et recherche">
        <SegmentedControl<Filtre>
          label="Distributions affichées"
          value={filtre}
          onValueChange={setFiltre}
          options={[
            { value: "venir", label: "À venir", count: 3 },
            { value: "brouillons", label: "Brouillons", count: 2 },
            { value: "passees", label: "Passées", count: 12 },
          ]}
        />
        <SearchField label="Rechercher une personne" placeholder="Nom ou prénom" value={recherche} onValueChange={setRecherche} className="max-w-md" />
      </Section>

      <Section titre="Jauges et rail">
        <div className="grid gap-6 md:grid-cols-3">
          <Jauge valeur={48} capacite={80} libelle="48 inscrits sur 80" detail="32 places" />
          <Jauge valeur={60} capacite={60} attente={6} libelle="Complet" detail="6 en attente" detailTon="attente" />
          <Jauge valeur={9} capacite={14} ton="encre" libelle="Bénévoles 9 sur 14" detail="5 manquent" detailTon="attente" />
        </div>
        <Rail libelle="Avancement de la distribution" etapes={["Préparer", "Publier", "Remplir", "Jour J", "Bilan"]} courante={3} />
      </Section>

      <Section titre="Billet">
        <Billet
          className="max-w-md"
          date="2026-10-15"
          horaire="17:45 - 18:00"
          lieu={<>Local Rangueil<br />118 route de Narbonne</>}
          statut={<Badge variant="accent">Confirmée</Badge>}
          note="Pensez à un sac"
          actions={
            <>
              <a href="#" className={actionBillet}><MapPin aria-hidden="true" className="size-5" />Itinéraire</a>
              <button type="button" className={actionBillet}>Je ne peux plus venir</button>
            </>
          }
        />
      </Section>

      <Section titre="Liste dense">
        <List className="max-w-2xl">
          <ListRow
            href="#"
            debut={<div className="flex w-11 flex-col items-center"><span className="font-mono text-xs text-muted-foreground">JEU.</span><span className="font-display text-2xl font-extrabold">22</span></div>}
            titre="17:30 - 19:30"
            sousTitre={<Jauge taille="sm" valeur={28} capacite={80} libelle="52 places restantes" />}
          />
          <ListRow titre="Amina Diallo" sousTitre="17:45 - 18:00" fin={<Statut libelle={STATUT_INSCRIPTION.CONFIRMEE} />} />
        </List>
      </Section>

      <Section titre="Chiffres">
        <div className="flex flex-wrap gap-10">
          <Stat valeur={57} libelle="bénéficiaires servis" detail="en octobre" />
          <Stat valeur="85 %" libelle="de présence" />
          <Stat valeur={10} libelle="bénévoles mobilisés" />
        </div>
      </Section>

      <Section titre="Formulaire, carte, feuille">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quand et où</CardTitle>
              <CardDescription>Les bénéficiaires verront ces informations.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormField label="Titre" htmlFor="titre" required hint="Proposé à partir de la date.">
                <Input id="titre" defaultValue="Distribution du jeudi 22 octobre" />
              </FormField>
              <FormField label="Capacité" htmlFor="capacite" error="La capacité ne peut pas descendre sous 28 inscrits.">
                <Input id="capacite" aria-invalid defaultValue="20" />
              </FormField>
              <FormField label="Description" htmlFor="description">
                <Textarea id="description" placeholder="Informations utiles aux personnes inscrites" />
              </FormField>
            </CardContent>
          </Card>
          <div className="flex flex-col items-start gap-4">
            <Sheet>
              <SheetTrigger render={<Button variant="outline" />}>Ouvrir une feuille</SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Ajouter un bénévole</SheetTitle>
                  <SheetDescription>Un membre existant ou un visiteur ponctuel.</SheetDescription>
                </SheetHeader>
                <FormField label="Nom" htmlFor="nom-feuille"><Input id="nom-feuille" /></FormField>
                <Button>Ajouter</Button>
              </SheetContent>
            </Sheet>
            <Card className="w-full">
              <EmptyState icon={Trash2} title="Aucune denrée" description="Saisissez ce qui a été récupéré pour calculer le contenu du sac." action={{ label: "Saisir les denrées", href: "#" }} size="sm" />
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
}
