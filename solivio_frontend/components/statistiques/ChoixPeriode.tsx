"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PERIODES, type Periode } from "@/lib/periodes";

interface Props {
  periode: Periode;
  /* Periodes predefinies calculees cote serveur, pour un rendu stable. */
  predefinies: Record<string, Periode>;
}

/* Une seule facon de choisir la periode : un raccourci, ou "Autre période" pour deux dates. */
export function ChoixPeriode({ periode, predefinies }: Props) {
  const router = useRouter();
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const [debut, setDebut] = useState(periode.debut);
  const [fin, setFin] = useState(periode.fin);
  const courante =
    PERIODES.find((p) => predefinies[p.cle]?.debut === periode.debut && predefinies[p.cle]?.fin === periode.fin)?.cle ?? "autre";

  function aller(p: Periode) {
    router.replace(`${chemin}?debut=${p.debut}&fin=${p.fin}`, { scroll: false });
  }

  return (
    <>
      <SegmentedControl<string>
        label="Période"
        value={courante}
        onValueChange={(v) => (v === "autre" ? setOuvert(true) : aller(predefinies[v]))}
        options={[...PERIODES.map((p) => ({ value: p.cle as string, label: p.libelle })), { value: "autre", label: "Autre période" }]}
      />
      <Sheet open={ouvert} onOpenChange={setOuvert}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Autre période</SheetTitle>
            <SheetDescription>Les distributions closes entre ces deux dates, incluses.</SheetDescription>
          </SheetHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setOuvert(false);
              aller({ debut, fin });
            }}
          >
            <FormField label="Du" htmlFor="periode-debut">
              <Input id="periode-debut" type="date" value={debut} max={fin} required onChange={(e) => setDebut(e.target.value)} />
            </FormField>
            <FormField label="Au" htmlFor="periode-fin">
              <Input id="periode-fin" type="date" value={fin} min={debut} required onChange={(e) => setFin(e.target.value)} />
            </FormField>
            <Button type="submit" size="lg" disabled={!debut || !fin || debut > fin}>
              Afficher
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
