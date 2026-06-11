import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PointageListe } from "@/components/pointage/PointageListe";
import * as distributionsApi from "@/lib/api/distributions";
import type { PointageInfoResponse } from "@/types/distribution";

vi.mock("@/lib/api/distributions", () => ({
  rechercherPointage: vi.fn(),
  pointer: vi.fn(),
}));

const resultMock: PointageInfoResponse = {
  inscriptionId: "insc-1",
  nom: "Dupont",
  prenom: "Marie",
  type: "BENEFICIAIRE",
  statut: "CONFIRMEE",
  presence: "NON_POINTE",
  heureCreneauDebut: null,
  heureCreneauFin: null,
};

// Avance le debounce et vide la file de microtasks/promesses pending.
async function avancerDebounce(ms = 350) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  // Vide les promesses resolues par le mock.
  await act(async () => {});
}

describe("PointageListe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("affiche le champ de recherche", () => {
    render(<PointageListe distributionId="dist-1" />);
    expect(screen.getByPlaceholderText(/Rechercher par nom ou prenom/)).toBeInTheDocument();
  });

  it("ne recherche pas si champ vide", async () => {
    render(<PointageListe distributionId="dist-1" />);
    fireEvent.change(screen.getByPlaceholderText(/Rechercher par nom ou prenom/), {
      target: { value: "" },
    });
    await avancerDebounce(400);
    expect(distributionsApi.rechercherPointage).not.toHaveBeenCalled();
  });

  it("recherche automatiquement apres debounce avec 2+ caracteres", async () => {
    vi.mocked(distributionsApi.rechercherPointage).mockResolvedValue([resultMock]);
    render(<PointageListe distributionId="dist-1" />);

    fireEvent.change(screen.getByPlaceholderText(/Rechercher par nom ou prenom/), {
      target: { value: "Ma" },
    });

    // Avant le debounce : pas encore appele
    expect(distributionsApi.rechercherPointage).not.toHaveBeenCalled();

    await avancerDebounce();

    expect(distributionsApi.rechercherPointage).toHaveBeenCalledWith("dist-1", "Ma");
  });

  it("annule le debounce precedent si l'utilisateur continue de taper", async () => {
    vi.mocked(distributionsApi.rechercherPointage).mockResolvedValue([resultMock]);
    render(<PointageListe distributionId="dist-1" />);

    const input = screen.getByPlaceholderText(/Rechercher par nom ou prenom/);
    fireEvent.change(input, { target: { value: "Ma" } });
    act(() => { vi.advanceTimersByTime(200); }); // pas encore 300ms

    fireEvent.change(input, { target: { value: "Mar" } });
    await avancerDebounce();

    // Une seule requete, avec "Mar" et non "Ma"
    expect(distributionsApi.rechercherPointage).toHaveBeenCalledTimes(1);
    expect(distributionsApi.rechercherPointage).toHaveBeenCalledWith("dist-1", "Mar");
  });

  it("recherche immediatement au clic sur Rechercher", async () => {
    vi.mocked(distributionsApi.rechercherPointage).mockResolvedValue([resultMock]);
    render(<PointageListe distributionId="dist-1" />);

    fireEvent.change(screen.getByPlaceholderText(/Rechercher par nom ou prenom/), {
      target: { value: "Marie" },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Rechercher"));
    });
    await act(async () => {});

    expect(distributionsApi.rechercherPointage).toHaveBeenCalledWith("dist-1", "Marie");
  });

  it("affiche le nom de l'inscrit apres recherche", async () => {
    vi.mocked(distributionsApi.rechercherPointage).mockResolvedValue([resultMock]);
    render(<PointageListe distributionId="dist-1" />);

    fireEvent.change(screen.getByPlaceholderText(/Rechercher par nom ou prenom/), {
      target: { value: "Du" },
    });
    await avancerDebounce();

    expect(screen.getByText("Dupont Marie")).toBeInTheDocument();
  });

  it("appelle pointer avec PRESENT au clic sur le bouton de presence", async () => {
    vi.mocked(distributionsApi.rechercherPointage).mockResolvedValue([resultMock]);
    vi.mocked(distributionsApi.pointer).mockResolvedValue(
      { ...resultMock, presence: "PRESENT" } as never,
    );

    render(<PointageListe distributionId="dist-1" />);
    fireEvent.change(screen.getByPlaceholderText(/Rechercher par nom ou prenom/), {
      target: { value: "Du" },
    });
    await avancerDebounce();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Marquer present" }));
    });
    await act(async () => {});

    expect(distributionsApi.pointer).toHaveBeenCalledWith("dist-1", "insc-1", "PRESENT");
  });

  it("affiche un message si aucun resultat", async () => {
    vi.mocked(distributionsApi.rechercherPointage).mockResolvedValue([]);
    render(<PointageListe distributionId="dist-1" />);

    fireEvent.change(screen.getByPlaceholderText(/Rechercher par nom ou prenom/), {
      target: { value: "Inconnu" },
    });
    await avancerDebounce();

    expect(screen.getByText(/Aucun inscrit trouve/)).toBeInTheDocument();
  });

  it("efface les resultats quand le champ est vide", async () => {
    vi.mocked(distributionsApi.rechercherPointage).mockResolvedValue([resultMock]);
    render(<PointageListe distributionId="dist-1" />);

    const input = screen.getByPlaceholderText(/Rechercher par nom ou prenom/);
    fireEvent.change(input, { target: { value: "Du" } });
    await avancerDebounce();
    expect(screen.getByText("Dupont Marie")).toBeInTheDocument();

    // Vide le champ : le delai est 0ms mais passe quand meme par setTimeout.
    fireEvent.change(input, { target: { value: "" } });
    await act(async () => { vi.advanceTimersByTime(10); });
    await act(async () => {});

    expect(screen.queryByText("Dupont Marie")).not.toBeInTheDocument();
  });
});
