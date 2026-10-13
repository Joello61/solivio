import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BoutonDesinscription } from "@/components/inscriptions/BoutonDesinscription";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const desinscrire = vi.fn();
vi.mock("@/lib/api/distributions", () => ({ desinscrire: (...a: unknown[]) => desinscrire(...a) }));

const props = { distributionId: "d1", inscriptionId: "i1", titre: "Distribution du jeudi", benevole: false, enAttente: false };

describe("BoutonDesinscription", () => {
  beforeEach(() => {
    desinscrire.mockReset();
    refresh.mockReset();
  });

  it("desinscrit apres confirmation puis rafraichit la page", async () => {
    desinscrire.mockResolvedValue(undefined);
    render(<BoutonDesinscription {...props} />);

    await userEvent.click(screen.getByRole("button", { name: "Me désinscrire" }));
    const boite = screen.getByRole("dialog");
    expect(boite).toHaveTextContent(/proposée à la personne suivante/);
    await userEvent.click(within(boite).getByRole("button", { name: "Me désinscrire" }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(desinscrire).toHaveBeenCalledWith("d1", "i1");
  });

  it("ne fait rien si la personne garde son inscription", async () => {
    render(<BoutonDesinscription {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "Me désinscrire" }));
    await userEvent.click(screen.getByRole("button", { name: "Garder mon inscription" }));
    expect(desinscrire).not.toHaveBeenCalled();
  });

  it("adapte le message a la liste d'attente et au benevole, et affiche le refus du backend", async () => {
    desinscrire.mockRejectedValue(new Error("Desinscription impossible : la distribution est terminee"));
    render(<BoutonDesinscription {...props} benevole enAttente />);

    await userEvent.click(screen.getByRole("button", { name: "Me désinscrire" }));
    const boite = screen.getByRole("dialog");
    expect(boite).toHaveTextContent(/quitterez la liste d'attente/);
    expect(boite).toHaveTextContent(/coordinateurs sont prévenus/);
    await userEvent.click(within(boite).getByRole("button", { name: "Me désinscrire" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("terminee");
    expect(refresh).not.toHaveBeenCalled();
  });
});
