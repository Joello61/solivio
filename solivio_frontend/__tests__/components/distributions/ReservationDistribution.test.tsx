import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationDistribution } from "@/components/distributions/ReservationDistribution";
import type { CreneauResponse } from "@/types/distribution";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const inscrire = vi.fn();
vi.mock("@/lib/api/distributions", () => ({ inscrire: (...a: unknown[]) => inscrire(...a) }));
const toast = vi.hoisted(() => ({ success: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const creneau = (id: string, debut: string, places: number): CreneauResponse => ({
  id,
  heureDebut: `${debut}:00`,
  heureFin: "19:30:00",
  capacite: 10,
  placesRestantes: places,
  confirmes: null,
  enAttente: null,
});
const creneaux = [creneau("c1", "17:30", 0), creneau("c2", "17:45", 4)];

describe("ReservationDistribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("propose les horaires avec leurs places et reserve celui choisi", async () => {
    inscrire.mockResolvedValue({ statut: "CONFIRMEE", rangListeAttente: null });
    render(
      <ReservationDistribution distributionId="d1" creneaux={creneaux} modeCreneau="CRENEAUX_DECOUPES" type="BENEFICIAIRE" placesRestantes={4} />,
    );

    expect(screen.getByRole("radio", { name: /17:30 complet/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /17:45 4 places/ }));
    await userEvent.click(screen.getByRole("button", { name: "Réserver à 17:45" }));

    expect(inscrire).toHaveBeenCalledWith("d1", "BENEFICIAIRE", "c2");
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/réservé/));
  });

  it("demande un horaire avant de reserver", async () => {
    render(
      <ReservationDistribution distributionId="d1" creneaux={creneaux} modeCreneau="CRENEAUX_DECOUPES" type="BENEFICIAIRE" placesRestantes={4} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Réserver ma place" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choisissez d'abord votre horaire.");
    expect(inscrire).not.toHaveBeenCalled();
  });

  it("propose la liste d'attente sur un horaire complet et annonce le rang", async () => {
    inscrire.mockResolvedValue({ statut: "LISTE_ATTENTE", rangListeAttente: 3 });
    render(
      <ReservationDistribution distributionId="d1" creneaux={creneaux} modeCreneau="CRENEAUX_DECOUPES" type="BENEFICIAIRE" placesRestantes={4} />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /17:30/ }));
    expect(screen.getByText(/Cet horaire est complet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Rejoindre la liste d'attente" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/rang 3/)));
  });

  it("explique la limite de frequence sans la presenter comme une erreur", async () => {
    inscrire.mockRejectedValue(Object.assign(new Error("Vous etes deja inscrit"), { code: "FREQUENCY_LIMIT" }));
    render(
      <ReservationDistribution distributionId="d1" creneaux={[creneaux[1]]} modeCreneau="CRENEAU_UNIQUE" type="BENEFICIAIRE" placesRestantes={4} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Réserver ma place" }));

    expect(await screen.findByText("Vous avez déjà une distribution cette semaine")).toBeInTheDocument();
    expect(screen.queryByText("Vous etes deja inscrit")).not.toBeInTheDocument();
    expect(inscrire).toHaveBeenCalledWith("d1", "BENEFICIAIRE", "c2");
  });

  it("n'affiche pas les places de creneau a un benevole", () => {
    render(
      <ReservationDistribution distributionId="d1" creneaux={creneaux} modeCreneau="CRENEAUX_DECOUPES" type="BENEVOLE" placesRestantes={2} />,
    );
    expect(screen.queryByText("complet")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Je viens aider" })).toBeInTheDocument();
  });
});
