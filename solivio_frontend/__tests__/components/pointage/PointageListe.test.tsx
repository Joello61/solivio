import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PointageListe } from "@/components/pointage/PointageListe";
import * as api from "@/lib/api/distributions";
import type { InscriptionResponse, PointageInfoResponse } from "@/types/distribution";

vi.mock("@/lib/api/distributions", () => ({
  rechercherPointage: vi.fn(),
  pointer: vi.fn(),
  listerVisiteursAdHoc: vi.fn().mockResolvedValue([]),
  envoyerInvitationVisiteur: vi.fn(),
}));
vi.mock("@/components/pointage/DialogAjoutBenevole", () => ({ DialogAjoutBenevole: () => null }));

const inscrit = (inscriptionId: string, nom: string, prenom: string, presence: PointageInfoResponse["presence"] = "NON_POINTE"): PointageInfoResponse => ({
  inscriptionId,
  nom,
  prenom,
  type: "BENEFICIAIRE",
  statut: "CONFIRMEE",
  presence,
  heureCreneauDebut: null,
  heureCreneauFin: null,
});

const inscrits = [inscrit("i1", "Dupont", "Marie"), inscrit("i2", "Bernard", "Léa"), inscrit("i3", "Martin", "Hugo", "PRESENT")];

function reponse(id: string, presence: InscriptionResponse["presence"]): InscriptionResponse {
  return { id, presence } as InscriptionResponse;
}

function afficher() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PointageListe distributionId="d1" />
    </QueryClientProvider>,
  );
}

const ligne = (nom: RegExp) => screen.getByText(nom).closest("li") as HTMLElement;

describe("PointageListe", () => {
  beforeEach(() => {
    vi.mocked(api.rechercherPointage).mockReset().mockResolvedValue(inscrits);
    vi.mocked(api.pointer).mockReset();
  });

  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it("charge toute la liste, triee, avec les compteurs et les onglets", async () => {
    afficher();
    expect(await screen.findByText("Bernard Léa")).toBeInTheDocument();
    expect(api.rechercherPointage).toHaveBeenCalledWith("d1", "");
    const noms = screen.getAllByRole("listitem").map((li) => li.querySelector("p")?.textContent);
    expect(noms).toEqual(["Bernard Léa", "Dupont Marie"]);
    expect(screen.getByText(/présent/).closest("p")).toHaveTextContent("1 présent sur 3 inscrits");

    await userEvent.click(screen.getByRole("tab", { name: /Pointés/ }));
    expect(screen.getByText("Martin Hugo")).toBeInTheDocument();
  });

  it("filtre cote client sans tenir compte des accents", async () => {
    afficher();
    await screen.findByText("Bernard Léa");
    await userEvent.type(screen.getByLabelText("Rechercher un inscrit"), "lea");
    expect(screen.getByText("Bernard Léa")).toBeInTheDocument();
    expect(screen.queryByText("Dupont Marie")).not.toBeInTheDocument();
  });

  it("affiche le pointage tout de suite, avant la reponse du serveur", async () => {
    let confirmer: (r: InscriptionResponse) => void = () => {};
    vi.mocked(api.pointer).mockImplementation(() => new Promise((ok) => (confirmer = ok)));
    afficher();
    await screen.findByText("Dupont Marie");

    await userEvent.click(screen.getByRole("button", { name: "Marquer Marie Dupont présent" }));

    expect(screen.getByText(/présent/).closest("p")).toHaveTextContent("2 présents sur 3 inscrits");
    await userEvent.click(screen.getByRole("tab", { name: /Pointés/ }));
    expect(within(ligne(/Dupont Marie/)).getByText("Envoi")).toBeInTheDocument();

    confirmer(reponse("i1", "PRESENT"));
    await waitFor(() => expect(within(ligne(/Dupont Marie/)).queryByText("Envoi")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Marquer Marie Dupont présent" })).toHaveAttribute("aria-pressed", "true");
  });

  it("revient a l'etat du serveur sur un refus definitif et propose de reessayer", async () => {
    vi.mocked(api.pointer).mockRejectedValueOnce(Object.assign(new Error("Distribution terminee"), { status: 409 }));
    afficher();
    await screen.findByText("Dupont Marie");

    await userEvent.click(screen.getByRole("button", { name: "Marquer Marie Dupont présent" }));

    const reessayer = await screen.findByRole("button", { name: /Échec, réessayer/ });
    expect(api.pointer).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/présent/).closest("p")).toHaveTextContent("1 présent sur 3 inscrits");

    vi.mocked(api.pointer).mockResolvedValueOnce(reponse("i1", "PRESENT"));
    await userEvent.click(reessayer);
    await waitFor(() => expect(api.pointer).toHaveBeenCalledTimes(2));
    expect(api.pointer).toHaveBeenLastCalledWith("d1", "i1", "PRESENT");
  });

  it("reessaie apres une coupure reseau", async () => {
    vi.mocked(api.pointer)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(reponse("i1", "ABSENT"));
    afficher();
    await screen.findByText("Dupont Marie");

    await userEvent.click(screen.getByRole("button", { name: "Marquer Marie Dupont absent" }));

    await waitFor(() => expect(api.pointer).toHaveBeenCalledTimes(2), { timeout: 3000 });
    expect(screen.queryByRole("button", { name: /Échec/ })).not.toBeInTheDocument();
  });

  it("garde le pointage en attente hors ligne puis l'envoie au retour du reseau", async () => {
    vi.mocked(api.pointer).mockResolvedValue(reponse("i2", "PRESENT"));
    afficher();
    await screen.findByText("Bernard Léa");
    onlineManager.setOnline(false);

    await userEvent.click(screen.getByRole("button", { name: "Marquer Léa Bernard présent" }));
    await userEvent.click(screen.getByRole("tab", { name: /Pointés/ }));

    expect(await within(ligne(/Bernard Léa/)).findByText("En attente d'envoi")).toBeInTheDocument();
    expect(screen.getByText(/en attente d'envoi/, { selector: "p" })).toBeInTheDocument();
    expect(api.pointer).not.toHaveBeenCalled();

    onlineManager.setOnline(true);
    await waitFor(() => expect(api.pointer).toHaveBeenCalledWith("d1", "i2", "PRESENT"));
  });
});
