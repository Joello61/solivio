"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UserPlus, Search, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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

export function DialogAjoutBenevole({ distributionId, onBenevoleAjoute, onVisiteurAjoute }: Props) {
  const [ouvert, setOuvert] = useState(false);

  function handleOpenChange(open: boolean) {
    setOuvert(open);
  }

  return (
    <Dialog open={ouvert} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <UserPlus className="size-4" />
            Ajouter un benevole
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un benevole</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="existant">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="existant" className="flex-1">Membre existant</TabsTrigger>
            <TabsTrigger value="visiteur" className="flex-1">Nouveau visiteur</TabsTrigger>
          </TabsList>
          <TabsContent value="existant">
            <OngletMembreExistant
              distributionId={distributionId}
              onAjoute={(r) => { onBenevoleAjoute(r); setOuvert(false); }}
            />
          </TabsContent>
          <TabsContent value="visiteur">
            <OngletVisiteur
              distributionId={distributionId}
              onAjoute={(r) => { onVisiteurAjoute(r); setOuvert(false); }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
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
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Erreur lors de l'ajout.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-3 pt-3">
      <div className="relative">
        {chargement
          ? <Spinner size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        }
        <Input
          className="pl-9"
          placeholder="Rechercher par nom ou prenom..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          autoFocus
        />
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      {suggestions.length > 0 && (
        <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/60">
          {suggestions.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-teal-50/30">
              <div>
                <p className="text-sm font-medium">{m.nom} {m.prenom}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending === m.id}
                onClick={() => handleAjouter(m)}
              >
                {pending === m.id ? <Spinner size="sm" /> : <UserCheck className="size-4" />}
                Ajouter
              </Button>
            </div>
          ))}
        </div>
      )}

      {recherche.length >= 2 && !chargement && suggestions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Aucun membre trouve pour &quot;{recherche}&quot;.
        </p>
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
      const err = e as { detail?: string; message?: string };
      setErreur(err.detail ?? err.message ?? "Erreur lors de l'ajout.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nom *</label>
          <Input
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Prenom *</label>
          <Input
            placeholder="Prenom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Email (optionnel)</label>
        <Input
          type="email"
          placeholder="Pour envoyer une invitation plus tard"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Role (optionnel)</label>
        <Input
          placeholder="Ex : Accueil, Distribution..."
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={pending || !nom.trim() || !prenom.trim()}>
          {pending ? <><Spinner size="sm" /> Ajout...</> : "Ajouter au pointage"}
        </Button>
      </div>
    </form>
  );
}
