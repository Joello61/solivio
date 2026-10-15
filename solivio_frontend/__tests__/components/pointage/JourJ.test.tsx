import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourJ } from "@/components/pointage/JourJ";
import * as api from "@/lib/api/distributions";
import type { InscriptionResponse, PointageInfoResponse } from "@/types/distribution";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: vi.fn() }));
vi.mock("@/lib/api/distributions", () => ({
  rechercherPointage: vi.fn(),
  pointer: vi.fn(),
  listerVisiteursAdHoc: vi.fn().mockResolvedValue([]),
  envoyerInvitationVisiteur: vi.fn(),
  terminerDistribution: vi.fn(),
}));
vi.mock("@/components/pointage/AjoutEquipe", () => ({ AjoutEquipe: () => null }));

const inscrit = (
  inscriptionId: string,
  nom: string,
  prenom: string,
  presence: PointageInfoResponse["presence"] = "NON_POINTE",
  type: PointageInfoResponse["type"] = "BENEFICIAIRE",
): PointageInfoResponse => ({
  inscriptionId,
  nom,
  prenom,
  type,
  statut: "CONFIRMEE",
  presence,
  heureCreneauDebut: null,
  heureCreneauFin: null,
});

const inscrits = [
  inscrit("i1", "Dupont", "Marie"),
  inscrit("i2", "Bernard", "Léa"),
  inscrit("i3", "Martin", "Hugo", "PRESENT"),
  inscrit("b1", "Petit", "Paul", "PRESENT", "BENEVOLE"),
];

function reponse(id: string, presence: InscriptionResponse["presence"]): InscriptionResponse {
  return { id, presence } as InscriptionResponse;
}

function afficher(props: Partial<React.ComponentProps<typeof JourJ>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <JourJ distributionId="d1" jour="Jeudi 15 octobre" {...props} />
    </QueryClientProvider>,
  );
}

const compteur = () => screen.getByText(/présents? sur/).closest("p") as HTMLElement;
const ligne = (nom: RegExp) => screen.getByText(nom).closest("li") as HTMLElement;
const vue = (nom: RegExp) => screen.getByRole("button", { name: nom });

describe("JourJ", () => {
  beforeEach(() => {
    vi.mocked(api.rechercherPointage).mockReset().mockResolvedValue(inscrits);
    vi.mocked(api.pointer).mockReset();
    vi.mocked(toast).mockReset();
    push.mockReset();
  });

  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it("compte les beneficiaires presents et range l'equipe a part", async () => {
    afficher();
    expect(await screen.findByText("Bernard Léa")).toBeInTheDocument();
    expect(api.rechercherPointage).toHaveBeenCalledWith("d1", "");
    expect(compteur()).toHaveTextContent(/1\s*présent sur 3/);
    expect(screen.getByText("1 bénévole")).toBeInTheDocument();
    const noms = screen.getAllByRole("button", { name: /^Marquer .* présent$/ }).map((b) => b.getAttribute("aria-label"));
    expect(noms).toEqual(["Marquer Léa Bernard présent", "Marquer Marie Dupont présent"]);

    await userEvent.click(vue(/Équipe/));
    expect(screen.getByText("Petit Paul")).toBeInTheDocument();
    expect(screen.queryByText("Bernard Léa")).not.toBeInTheDocument();
  });

  it("filtre cote client sans tenir compte des accents", async () => {
    afficher();
    await screen.findByText("Bernard Léa");
    await userEvent.type(screen.getByLabelText("Rechercher un inscrit"), "lea");
    expect(screen.getByText("Bernard Léa")).toBeInTheDocument();
    expect(screen.queryByText("Dupont Marie")).not.toBeInTheDocument();
  });

  it("pointe d'un toucher, tout de suite, et propose d'annuler", async () => {
    let confirmer: (r: InscriptionResponse) => void = () => {};
    vi.mocked(api.pointer).mockImplementation(() => new Promise((ok) => (confirmer = ok)));
    afficher();
    await screen.findByText("Dupont Marie");

    await userEvent.click(screen.getByRole("button", { name: "Marquer Marie Dupont présent" }));

    expect(compteur()).toHaveTextContent(/2\s*présents sur 3/);
    await userEvent.click(vue(/Pointés/));
    expect(within(ligne(/Dupont Marie/)).getByText("Envoi")).toBeInTheDocument();
    confirmer(reponse("i1", "PRESENT"));
    await waitFor(() => expect(within(ligne(/Dupont Marie/)).queryByText("Envoi")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Marquer Marie Dupont présent" })).toHaveAttribute("aria-pressed", "true");

    const [message, options] = vi.mocked(toast).mock.calls[0];
    expect(message).toBe("Présence notée : Marie Dupont");
    vi.mocked(api.pointer).mockResolvedValueOnce(reponse("i1", "NON_POINTE"));
    (options?.action as unknown as { onClick: () => void }).onClick();
    await waitFor(() => expect(api.pointer).toHaveBeenLastCalledWith("d1", "i1", "NON_POINTE"));
  });

  it("revient a l'etat du serveur sur un refus definitif et propose de reessayer", async () => {
    vi.mocked(api.pointer).mockRejectedValueOnce(Object.assign(new Error("Distribution terminee"), { status: 409 }));
    afficher();
    await screen.findByText("Dupont Marie");

    await userEvent.click(screen.getByRole("button", { name: "Marquer Marie Dupont présent" }));

    const reessayer = await screen.findByRole("button", { name: /Échec, réessayer/ });
    expect(api.pointer).toHaveBeenCalledTimes(1);
    expect(compteur()).toHaveTextContent(/1\s*présent sur 3/);

    vi.mocked(api.pointer).mockResolvedValueOnce(reponse("i1", "PRESENT"));
    await userEvent.click(reessayer);
    await waitFor(() => expect(api.pointer).toHaveBeenCalledTimes(2));
    expect(api.pointer).toHaveBeenLastCalledWith("d1", "i1", "PRESENT");
  });

  it("garde le pointage en attente hors ligne puis l'envoie au retour du reseau", async () => {
    vi.mocked(api.pointer).mockResolvedValue(reponse("i2", "PRESENT"));
    afficher();
    await screen.findByText("Bernard Léa");
    onlineManager.setOnline(false);

    await userEvent.click(screen.getByRole("button", { name: "Marquer Léa Bernard présent" }));
    await userEvent.click(vue(/Pointés/));

    expect(await within(ligne(/Bernard Léa/)).findByText("En attente d'envoi")).toBeInTheDocument();
    expect(screen.getByText(/1 en attente d'envoi/)).toBeInTheDocument();
    expect(api.pointer).not.toHaveBeenCalled();

    onlineManager.setOnline(true);
    await waitFor(() => expect(api.pointer).toHaveBeenCalledWith("d1", "i2", "PRESENT"));
  });

  it("marque absent depuis le menu de la ligne", async () => {
    vi.mocked(api.pointer).mockResolvedValue(reponse("i1", "ABSENT"));
    afficher();
    await screen.findByText("Dupont Marie");

    await userEvent.click(screen.getByRole("button", { name: "Plus d'actions pour Marie Dupont" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Marquer absent" }));

    await waitFor(() => expect(api.pointer).toHaveBeenCalledWith("d1", "i1", "ABSENT"));
    expect(toast).not.toHaveBeenCalled();
  });

  it("cloture depuis le jour J et mene au bilan", async () => {
    vi.mocked(api.terminerDistribution).mockResolvedValue({} as never);
    afficher({ peutGerer: true });
    await screen.findByText("Dupont Marie");

    await userEvent.click(screen.getByRole("button", { name: "Clore et voir le bilan" }));
    expect(screen.getByText(/2 personnes encore à pointer seront comptées absentes/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clore la distribution" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/distributions/d1?onglet=bilan"));
  });

  it("ne propose ni cloture ni ajout a un benevole", async () => {
    afficher();
    await screen.findByText("Dupont Marie");
    expect(screen.queryByRole("button", { name: "Clore et voir le bilan" })).not.toBeInTheDocument();
  });
});
