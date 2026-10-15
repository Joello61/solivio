"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { List, ListRow } from "@/components/ui/list-row";
import { Spinner } from "@/components/ui/spinner";
import { envoyerInvitationVisiteur } from "@/lib/api/distributions";
import { messageErreur } from "@/lib/erreurs";
import type { PointageAdHocResponse } from "@/types/distribution";

interface Props {
  distributionId: string;
  visiteurs: PointageAdHocResponse[];
}

/* Visiteurs venus aider ce jour : presents d'office, invitables a creer leur compte. */
export function Visiteurs({ distributionId, visiteurs }: Props) {
  const client = useQueryClient();
  const invitation = useMutation({
    mutationFn: (visiteurId: string) => envoyerInvitationVisiteur(distributionId, visiteurId),
    onSuccess: (_reponse, visiteurId) =>
      client.setQueryData<PointageAdHocResponse[]>(["pointage-visiteurs", distributionId], (prev) =>
        prev?.map((v) => (v.id === visiteurId ? { ...v, invitationEnvoyee: true } : v)),
      ),
  });

  return (
    <section aria-labelledby="titre-visiteurs" className="flex flex-col gap-2">
      <h2 id="titre-visiteurs" className="flex justify-between px-0.5 pt-1 font-mono text-sm font-semibold text-foreground">
        Visiteurs du jour
        <span className="font-normal text-muted-foreground">{visiteurs.length}</span>
      </h2>
      {invitation.isError && <Alert variant="destructive">{messageErreur(invitation.error, "L'invitation n'est pas partie. Réessayez.")}</Alert>}
      <List>
        {visiteurs.map((v) => (
          <ListRow
            key={v.id}
            titre={`${v.nom} ${v.prenom}`}
            sousTitre={[v.role, "présent"].filter(Boolean).join(", ")}
            fin={
              v.invitationEnvoyee ? (
                <span className="text-sm text-muted-foreground">Invité</span>
              ) : v.email ? (
                <Button size="sm" variant="outline" disabled={invitation.isPending} onClick={() => invitation.mutate(v.id)}>
                  {invitation.isPending && invitation.variables === v.id ? <Spinner size="sm" /> : <Mail aria-hidden="true" />}
                  Inviter
                </Button>
              ) : null
            }
          />
        ))}
      </List>
    </section>
  );
}
