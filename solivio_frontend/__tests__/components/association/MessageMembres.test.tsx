import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MessageMembres } from "@/components/association/MessageMembres";
import { envoyerEmailLibre } from "@/lib/api/notification";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/lib/api/notification", () => ({ envoyerEmailLibre: vi.fn().mockResolvedValue(undefined) }));

const destinataires = { BENEVOLES: 42, BENEFICIAIRES: 120, COORDINATEURS: 5, RESPONSABLES: 2, TOUS: 169 };

describe("MessageMembres", () => {
  it("annonce le nombre de destinataires et confirme avant d'envoyer", async () => {
    render(<MessageMembres destinataires={destinataires} />);
    expect(screen.getByText("42 destinataires")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /Bénévoles/ }));
    await userEvent.type(screen.getByLabelText(/Sujet/), "Réunion de rentrée");
    await userEvent.type(screen.getByLabelText(/Message/), "Rendez-vous jeudi.");
    expect(screen.getByRole("heading", { name: "Aperçu" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(await screen.findByRole("heading", { name: "Envoyer à 42 destinataires ?" })).toBeInTheDocument();
    expect(envoyerEmailLibre).not.toHaveBeenCalled();
    await userEvent.click(screen.getAllByRole("button", { name: "Envoyer" }).at(-1)!);
    expect(envoyerEmailLibre).toHaveBeenCalledWith({ cible: "BENEVOLES", sujet: "Réunion de rentrée", corps: "Rendez-vous jeudi." });
  });

  it("demande les destinataires avant tout", async () => {
    render(<MessageMembres destinataires={destinataires} />);
    await userEvent.type(screen.getByLabelText(/Sujet/), "Sujet");
    await userEvent.type(screen.getByLabelText(/Message/), "Texte");
    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(await screen.findByText("Choisissez les destinataires.")).toBeInTheDocument();
  });
});
