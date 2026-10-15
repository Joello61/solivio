"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DUREES_CRENEAU, genererCreneaux, type CreneauGenere } from "@/lib/creneaux";

interface Props {
  // Nombre de creneaux deja saisis, que la generation remplacera.
  nbExistants: number;
  onGenerer: (creneaux: CreneauGenere[]) => void;
}

/** Decoupe une plage horaire en creneaux reguliers, avec la frise des horaires obtenus. */
export function GenerateurCreneaux({ nbExistants, onGenerer }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [debut, setDebut] = useState("17:30");
  const [fin, setFin] = useState("19:30");
  const [duree, setDuree] = useState<string>("15");
  const [capacite, setCapacite] = useState("10");

  const apercu = genererCreneaux(debut, fin, Number(duree), Number(capacite));

  if (!ouvert) {
    return (
      <Button type="button" variant="secondary" className="self-start" onClick={() => setOuvert(true)}>
        <Wand2 aria-hidden="true" />
        Générer des créneaux réguliers
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-primary/30 bg-secondary/40 p-4">
      <div className="grid grid-cols-3 items-end gap-3">
        <FormField label="De" htmlFor="gen-debut">
          <Input id="gen-debut" type="time" value={debut} onChange={(e) => setDebut(e.target.value)} />
        </FormField>
        <FormField label="À" htmlFor="gen-fin">
          <Input id="gen-fin" type="time" value={fin} onChange={(e) => setFin(e.target.value)} />
        </FormField>
        <FormField label="Places par créneau" htmlFor="gen-capacite">
          <Input
            id="gen-capacite"
            type="number"
            inputMode="numeric"
            min={1}
            value={capacite}
            onChange={(e) => setCapacite(e.target.value)}
          />
        </FormField>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-base font-semibold text-foreground">Toutes les</span>
        <SegmentedControl
          label="Durée d'un créneau"
          value={duree}
          onValueChange={setDuree}
          options={DUREES_CRENEAU.map((d) => ({ value: String(d), label: `${d} min` }))}
        />
      </div>

      {apercu.length > 0 ? (
        <ol aria-label="Créneaux qui seront créés" className="flex flex-wrap gap-1.5">
          {apercu.map((c) => (
            <li key={c.heureDebut} className="rounded-md bg-card px-2 py-1 text-sm font-semibold tabular-nums text-foreground">
              {c.heureDebut}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="text-base text-muted-foreground" aria-live="polite">
        {apercu.length === 0
          ? "Vérifiez la plage horaire et le nombre de places."
          : `${apercu.length} créneaux de ${duree} min, ${apercu.length * Number(capacite)} places au total.`}
        {nbExistants > 0 && apercu.length > 0 &&
          (nbExistants > 1 ? ` Ils remplacent les ${nbExistants} créneaux saisis.` : " Ils remplacent le créneau saisi.")}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={apercu.length === 0}
          onClick={() => {
            onGenerer(apercu);
            setOuvert(false);
          }}
        >
          Générer
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOuvert(false)}>
          Fermer
        </Button>
      </div>
    </div>
  );
}
