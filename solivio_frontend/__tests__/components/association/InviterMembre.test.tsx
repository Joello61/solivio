import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { InviterMembre } from "@/components/association/InviterMembre";

const inviterMembre = vi.fn();
vi.mock("@/lib/api/association", () => ({
  inviterMembre: (...args: unknown[]) => inviterMembre(...args),
}));

describe("InviterMembre", () => {
  beforeEach(() => {
    inviterMembre.mockReset();
  });

  it("envoie l'email et le role, puis confirme l'envoi", async () => {
    inviterMembre.mockResolvedValue(undefined);
    render(<InviterMembre />);

    await userEvent.click(screen.getByRole("button", { name: /Inviter un membre/i }));
    await userEvent.type(screen.getByLabelText("Email"), "nouveau@exemple.fr");
    await userEvent.click(screen.getByRole("button", { name: /Envoyer l'invitation/i }));

    await waitFor(() =>
      expect(inviterMembre).toHaveBeenCalledWith({ email: "nouveau@exemple.fr", role: "benevole", coordoType: undefined }),
    );
    expect(await screen.findByText(/Invitation envoyée à nouveau@exemple.fr/)).toBeInTheDocument();
  });

  it("affiche le refus du backend", async () => {
    inviterMembre.mockImplementation(async () => {
      throw new Error("Une invitation est deja en attente pour cet email");
    });
    render(<InviterMembre />);

    await userEvent.click(screen.getByRole("button", { name: /Inviter un membre/i }));
    await userEvent.type(screen.getByLabelText("Email"), "deja@exemple.fr");
    await userEvent.click(screen.getByRole("button", { name: /Envoyer l'invitation/i }));

    expect(await screen.findByText(/deja en attente/)).toBeInTheDocument();
  });
});
