"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DUREES_CRENEAU, genererCreneaux, type CreneauGenere } from "@/lib/creneaux";
import { cn } from "@/lib/utils";

interface Props {
  // Nombre de creneaux deja saisis, que la generation remplacera.
  nbExistants: number;
  onGenerer: (creneaux: CreneauGenere[]) => void;
}

/** Decoupe une plage horaire en creneaux reguliers (par exemple toutes les 15 minutes). */
export function GenerateurCreneaux({ nbExistants, onGenerer }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [debut, setDebut] = useState("10:00");
  const [fin, setFin] = useState("12:00");
  const [duree, setDuree] = useState<number>(15);
  const [capacite, setCapacite] = useState("5");

  const apercu = genererCreneaux(debut, fin, duree, Number(capacite));

  if (!ouvert) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert(true)} className="text-primary">
        <Wand2 className="mr-1.5 size-3.5" />
        Générer des créneaux réguliers
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="gen-debut" className="text-xs">De</Label>
          <Input id="gen-debut" type="time" value={debut} onChange={(e) => setDebut(e.target.value)} className="h-11 sm:h-9" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="gen-fin" className="text-xs">À</Label>
          <Input id="gen-fin" type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="h-11 sm:h-9" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="gen-capacite" className="text-xs">Places par créneau</Label>
          <Input
            id="gen-capacite"
            type="number"
            inputMode="numeric"
            min={1}
            value={capacite}
            onChange={(e) => setCapacite(e.target.value)}
            className="h-11 sm:h-9"
          />
        </div>
        <fieldset className="space-y-1">
          <legend className="text-xs font-medium">Durée (min)</legend>
          <div className="flex gap-1">
            {DUREES_CRENEAU.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={duree === d}
                aria-label={`${d} minutes`}
                onClick={() => setDuree(d)}
                className={cn(
                  "h-11 flex-1 rounded-lg border text-xs font-medium transition-colors sm:h-9",
                  duree === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {apercu.length === 0
            ? "Vérifiez la plage horaire et le nombre de places."
            : `${apercu.length} créneau${apercu.length > 1 ? "x" : ""} de ${duree} min, ${apercu.length * Number(capacite)} places au total`}
          {nbExistants > 0 && apercu.length > 0 &&
            (nbExistants > 1 ? ` - remplace les ${nbExistants} créneaux saisis` : " - remplace le créneau saisi")}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert(false)}>
            Fermer
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={apercu.length === 0}
            onClick={() => {
              onGenerer(apercu);
              setOuvert(false);
            }}
          >
            Générer
          </Button>
        </div>
      </div>
    </div>
  );
}
