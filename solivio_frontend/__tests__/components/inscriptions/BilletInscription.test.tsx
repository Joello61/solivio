import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BilletInscription } from "@/components/inscriptions/BilletInscription";
import type { DonneesBillet } from "@/lib/mes-inscriptions";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const billet: DonneesBillet = {
  inscriptionId: "i1",
  distributionId: "d1",
  date: "2026-10-22",
  heureDebut: "18:00:00",
  heureFin: "18:30:00",
  lieuNom: "Campus Rangueil",
  adresse: "135 avenue de Rangueil",
  statut: "CONFIRMEE",
  rangListeAttente: null,
  benevole: false,
  desinscriptionPossible: true,
};

describe("BilletInscription", () => {
  it("montre le rendez-vous, l'itineraire et la desinscription", () => {
    render(<BilletInscription billet={billet} lienFiche />);

    expect(screen.getByRole("article", { name: /jeudi 22 octobre, 18:00 - 18:30/ })).toBeInTheDocument();
    expect(screen.getByText("Confirmée")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Campus Rangueil/ })).toHaveAttribute("href", "/distributions/d1");
    expect(screen.getByRole("link", { name: "Itinéraire" })).toHaveAttribute(
      "href",
      expect.stringContaining(encodeURIComponent("135 avenue de Rangueil")),
    );
    expect(screen.getByRole("button", { name: "Je ne peux plus venir" })).toBeInTheDocument();
  });

  it("donne le rang en liste d'attente et masque la desinscription apres pointage", () => {
    render(
      <BilletInscription
        billet={{ ...billet, statut: "LISTE_ATTENTE", rangListeAttente: 2, desinscriptionPossible: false, benevole: true }}
      />,
    );
    expect(screen.getByText("Liste d'attente, rang 2")).toBeInTheDocument();
    expect(screen.getByText("Bénévole")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
