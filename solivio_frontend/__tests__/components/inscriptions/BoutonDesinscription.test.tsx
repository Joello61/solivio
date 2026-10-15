import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BoutonDesinscription } from "@/components/inscriptions/BoutonDesinscription";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const desinscrire = vi.fn();
vi.mock("@/lib/api/distributions", () => ({ desinscrire: (...a: unknown[]) => desinscrire(...a) }));

const props = { distributionId: "d1", inscriptionId: "i1", titre: "la distribution du jeudi", enAttente: false };

describe("BoutonDesinscription", () => {
  beforeEach(() => {
    desinscrire.mockReset();
    refresh.mockReset();
  });

  it("libere la place apres confirmation puis rafraichit la page", async () => {
    desinscrire.mockResolvedValue(undefined);
    render(<BoutonDesinscription {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "Je ne peux plus venir" }));
    const boite = screen.getByRole("dialog");
    expect(boite).toHaveTextContent(/proposée à la personne suivante/);
    await userEvent.click(within(boite).getByRole("button", { name: "Libérer ma place" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(desinscrire).toHaveBeenCalledWith("d1", "i1");
  });

  it("ne fait rien si la personne garde sa place", async () => {
    render(<BoutonDesinscription {...props} apparence="billet" />);
    await userEvent.click(screen.getByRole("button", { name: "Je ne peux plus venir" }));
    await userEvent.click(screen.getByRole("button", { name: "Garder ma place" }));
    expect(desinscrire).not.toHaveBeenCalled();
  });

  it("previent d'un desistement de derniere minute", async () => {
    render(<BoutonDesinscription {...props} tardif />);
    await userEvent.click(screen.getByRole("button", { name: "Je ne peux plus venir" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(/Désistement de dernière minute.*coordinateurs seront prévenus/);
  });

  it("adapte le message a la liste d'attente et affiche le refus du backend", async () => {
    desinscrire.mockRejectedValue(new Error("Desinscription impossible : la distribution est terminee"));
    render(<BoutonDesinscription {...props} enAttente />);

    await userEvent.click(screen.getByRole("button", { name: "Quitter la liste d'attente" }));
    const boite = screen.getByRole("dialog");
    expect(boite).toHaveTextContent(/quitterez la liste d'attente/);
    expect(boite).not.toHaveTextContent(/coordinateurs/);
    await userEvent.click(within(boite).getByRole("button", { name: "Quitter la liste" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("terminee");
    expect(refresh).not.toHaveBeenCalled();
  });
});
