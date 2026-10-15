import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProchainesDistributions } from "@/components/accueil/ProchainesDistributions";
import type { DistributionPubliqueResponse } from "@/types/distribution";

const distribution = (surcharge: Partial<DistributionPubliqueResponse> = {}): DistributionPubliqueResponse => ({
  date: "2026-10-22",
  heureDebut: "17:30:00",
  heureFin: "19:30:00",
  lieuNom: "Local Rangueil",
  lieuAdresse: "135 avenue de Rangueil, Toulouse",
  complet: false,
  ...surcharge,
});

describe("ProchainesDistributions", () => {
  it("affiche le jour, les horaires, le lieu et les places", () => {
    render(<ProchainesDistributions distributions={[distribution()]} />);
    expect(screen.getByText("jeudi")).toBeInTheDocument();
    expect(screen.getByText("22 octobre")).toBeInTheDocument();
    expect(screen.getByText("17:30 - 19:30")).toBeInTheDocument();
    expect(screen.getByText("Local Rangueil, 135 avenue de Rangueil, Toulouse")).toBeInTheDocument();
    expect(screen.getByText("Places disponibles")).toBeInTheDocument();
  });

  it("annonce la liste d'attente quand la distribution est complete", () => {
    render(<ProchainesDistributions distributions={[distribution({ complet: true })]} />);
    expect(screen.getByText("Complet, liste d'attente possible")).toBeInTheDocument();
  });

  it("n'ecrit pas deux fois le nom du lieu repris dans l'adresse", () => {
    render(
      <ProchainesDistributions
        distributions={[distribution({ lieuAdresse: "Local Rangueil, 135 avenue de Rangueil" })]}
      />,
    );
    expect(screen.getByText("Local Rangueil, 135 avenue de Rangueil")).toBeInTheDocument();
  });

  it("dit qu'aucune date n'est annoncee", () => {
    render(<ProchainesDistributions distributions={[]} />);
    expect(screen.getByText(/Aucune distribution n'est annoncée/)).toBeInTheDocument();
  });

  it("invite a se connecter quand les dates ne sont pas lisibles", () => {
    render(<ProchainesDistributions distributions={null} />);
    expect(screen.getByText(/Connectez-vous pour les retrouver/)).toBeInTheDocument();
  });
});
