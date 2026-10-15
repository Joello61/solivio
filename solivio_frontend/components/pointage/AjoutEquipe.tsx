"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UserPlus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { List, ListRow } from "@/components/ui/list-row";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { messageErreur } from "@/lib/erreurs";
import {
  rechercherMembresAdHoc,
  ajouterBenevoleExistant,
  ajouterVisiteur,
} from "@/lib/api/distributions";
import type { MembreSuggestion, PointageInfoResponse, PointageAdHocResponse } from "@/types/distribution";

const DEBOUNCE_MS = 300;

interface Props {
  distributionId: string;
  onBenevoleAjoute: (inscription: PointageInfoResponse) => void;
  onVisiteurAjoute: (visiteur: PointageAdHocResponse) => void;
}

type Mode = "existant" | "visiteur";

/* Ajouter a l'equipe du jour un membre non inscrit ou un visiteur ponctuel. */
export function AjoutEquipe({ distributionId, onBenevoleAjoute, onVisiteurAjoute }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState<Mode>("existant");

  return (
    <Sheet open={ouvert} onOpenChange={setOuvert}>
      <SheetTrigger
        render={
          <Button variant="outline" className="self-start">
            <UserPlus aria-hidden="true" />
            Ajouter à l&apos;équipe
          </Button>
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Ajouter à l&apos;équipe</SheetTitle>
          <SheetDescription>La personne est pointée présente tout de suite.</SheetDescription>
        </SheetHeader>
        <SegmentedControl
          label="Qui ajouter"
          value={mode}
          onValueChange={setMode}
          options={[
            { value: "existant", label: "Membre" },
            { value: "visiteur", label: "Visiteur" },
          ]}
        />
        {mode === "existant" ? (
          <OngletMembreExistant
            distributionId={distributionId}
            onAjoute={(r) => {
              onBenevoleAjoute(r);
              setOuvert(false);
            }}
          />
        ) : (
          <OngletVisiteur
            distributionId={distributionId}
            onAjoute={(r) => {
              onVisiteurAjoute(r);
              setOuvert(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function OngletMembreExistant({
  distributionId,
  onAjoute,
}: {
  distributionId: string;
  onAjoute: (r: PointageInfoResponse) => void;
}) {
  const [recherche, setRecherche] = useState("");
  const [suggestions, setSuggestions] = useState<MembreSuggestion[]>([]);
  const [chargement, setChargement] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = useCallback(
    async (terme: string) => {
      if (terme.length < 2) {
        setSuggestions([]);
        return;
      }
      setChargement(true);
      try {
        const res = await rechercherMembresAdHoc(distributionId, terme);
        setSuggestions(res);
      } catch {
        setSuggestions([]);
      } finally {
        setChargement(false);
      }
    },
    [distributionId],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(recherche), DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [recherche, fetchSuggestions]);

  async function handleAjouter(membre: MembreSuggestion) {
    setPending(membre.id);
    setErreur(null);
    try {
      const result = await ajouterBenevoleExistant(distributionId, membre.id);
      onAjoute(result);
    } catch (e: unknown) {
      setErreur(messageErreur(e, "L'ajout n'a pas abouti. Réessayez dans un instant."));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <SearchField label="Chercher un membre" placeholder="Nom ou prénom" value={recherche} onValueChange={setRecherche} autoFocus />
      {erreur && <Alert variant="destructive">{erreur}</Alert>}
      {chargement && <Spinner size="sm" className="self-center" />}
      {suggestions.length > 0 && (
        <List>
          {suggestions.map((m) => (
            <ListRow
              key={m.id}
              titre={`${m.nom} ${m.prenom}`}
              fin={
                <Button size="sm" variant="outline" disabled={pending !== null} onClick={() => handleAjouter(m)}>
                  {pending === m.id && <Spinner size="sm" />}
                  Ajouter
                </Button>
              }
            />
          ))}
        </List>
      )}
      {recherche.length >= 2 && !chargement && suggestions.length === 0 && (
        <p className="text-base text-muted-foreground">Aucun membre ne correspond. Ajoutez la personne comme visiteur.</p>
      )}
    </div>
  );
}

function OngletVisiteur({
  distributionId,
  onAjoute,
}: {
  distributionId: string;
  onAjoute: (r: PointageAdHocResponse) => void;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !prenom.trim()) return;
    setPending(true);
    setErreur(null);
    try {
      const result = await ajouterVisiteur(distributionId, {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim() || undefined,
        role: role.trim() || undefined,
      });
      onAjoute(result);
    } catch (e: unknown) {
      setErreur(messageErreur(e, "L'ajout n'a pas abouti. Réessayez dans un instant."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Nom" htmlFor="visiteur-nom" required>
          <Input id="visiteur-nom" value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus />
        </FormField>
        <FormField label="Prénom" htmlFor="visiteur-prenom" required>
          <Input id="visiteur-prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        </FormField>
      </div>
      <FormField label="Email" htmlFor="visiteur-email" hint="Facultatif : pour l'inviter ensuite à créer son compte.">
        <Input id="visiteur-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Rôle du jour" htmlFor="visiteur-role" hint="Facultatif : accueil, distribution, rangement.">
        <Input id="visiteur-role" value={role} onChange={(e) => setRole(e.target.value)} />
      </FormField>
      {erreur && <Alert variant="destructive">{erreur}</Alert>}
      <Button type="submit" size="lg" disabled={pending || !nom.trim() || !prenom.trim()}>
        {pending && <Spinner size="sm" />}
        Ajouter et pointer présent
      </Button>
    </form>
  );
}
