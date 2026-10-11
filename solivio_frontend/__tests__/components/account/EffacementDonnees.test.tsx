import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EffacementDonnees } from "@/components/account/EffacementDonnees";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
}));

const effacerMesDonnees = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/api/profil", () => ({
  effacerMesDonnees: () => effacerMesDonnees(),
}));

describe("EffacementDonnees", () => {
  it("n'efface qu'apres saisie de la confirmation, puis renvoie a l'accueil", async () => {
    render(<EffacementDonnees />);
    fireEvent.click(screen.getByRole("button", { name: "Supprimer mes données" }));

    const confirmer = await screen.findAllByRole("button", { name: "Supprimer mes données" });
    const boutonDialogue = confirmer[confirmer.length - 1];
    expect(boutonDialogue).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Confirmation"), { target: { value: "SUPPRIMER" } });
    expect(boutonDialogue).toBeEnabled();
    fireEvent.click(boutonDialogue);

    await waitFor(() => expect(effacerMesDonnees).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/");
  });
});
