import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PointageActivite } from "@/components/activites/PointageActivite";

vi.mock("sonner", () => ({ toast: vi.fn() }));

const personnes = [
  { id: "p1", nomComplet: "Dupont Marie", presence: "NON_POINTE" as const, groupe: "Équipe" },
  { id: "p2", nomComplet: "Bernard Léa", presence: "NON_POINTE" as const, groupe: "Participants" },
  { id: "p3", nomComplet: "Martin Hugo", presence: "PRESENT" as const, groupe: "Participants" },
];

function afficher(pointer = vi.fn().mockResolvedValue({})) {
  render(<PointageActivite quitter="/evenements/e1" intitule="Fête de rentrée" personnes={personnes} pointer={pointer} />);
  return pointer;
}

describe("PointageActivite", () => {
  beforeEach(() => vi.mocked(toast).mockReset());

  it("compte les presents et groupe par role", () => {
    afficher();
    expect(screen.getByText(/présent sur 3/).closest("p")).toHaveTextContent(/1\s*présent sur 3/);
    expect(screen.getByRole("heading", { name: "Équipe" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Participants" })).toBeInTheDocument();
  });

  it("pointe d'un toucher et propose d'annuler", async () => {
    const pointer = afficher();
    await userEvent.click(screen.getByRole("button", { name: "Marquer Dupont Marie présent" }));
    expect(pointer).toHaveBeenCalledWith("p1", "PRESENT");
    expect(screen.getByText(/présents sur 3/).closest("p")).toHaveTextContent(/2\s*présents sur 3/);
    const [, options] = vi.mocked(toast).mock.calls[0];
    (options?.action as unknown as { onClick: () => void }).onClick();
    await waitFor(() => expect(pointer).toHaveBeenLastCalledWith("p1", "NON_POINTE"));
  });

  it("revient en arriere et propose de reessayer sur un refus", async () => {
    const pointer = afficher(vi.fn().mockRejectedValueOnce(new Error("refus")).mockResolvedValue({}));
    await userEvent.click(screen.getByRole("button", { name: "Marquer Bernard Léa présent" }));
    const reessayer = await screen.findByRole("button", { name: /Échec, réessayer/ });
    expect(screen.getByText(/présent sur 3/).closest("p")).toHaveTextContent(/1\s*présent sur 3/);
    await userEvent.click(reessayer);
    await waitFor(() => expect(pointer).toHaveBeenCalledTimes(2));
  });
});
