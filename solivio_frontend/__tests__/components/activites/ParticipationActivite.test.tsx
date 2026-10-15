import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ParticipationActivite } from "@/components/activites/ParticipationActivite";

const routeur = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => routeur }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

describe("ParticipationActivite", () => {
  it("inscrit sur le choix touche et signale un choix complet", async () => {
    const inscrire = vi.fn().mockResolvedValue({});
    render(
      <ParticipationActivite
        objet="l'événement"
        inscription={null}
        choix={[
          { cle: "STAFF", libelle: "Rejoindre l'équipe", complet: true },
          { cle: "PARTICIPANT", libelle: "Participer", detail: "Vous venez profiter.", complet: false },
        ]}
        inscrire={inscrire}
        desinscrire={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Rejoindre l'équipe" })).toBeDisabled();
    expect(screen.getByText("Complet")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Participer" }));
    expect(inscrire).toHaveBeenCalledWith("PARTICIPANT");
    await waitFor(() => expect(routeur.refresh).toHaveBeenCalled());
  });

  it("demande confirmation avant de retirer la personne", async () => {
    const desinscrire = vi.fn().mockResolvedValue(undefined);
    render(
      <ParticipationActivite objet="la session" inscription="Vous êtes inscrit." choix={[]} inscrire={vi.fn()} desinscrire={desinscrire} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Je ne peux plus venir" }));
    expect(desinscrire).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Me retirer" }));
    expect(desinscrire).toHaveBeenCalled();
  });

  it("ne montre rien sans inscription ni place ouverte", () => {
    const { container } = render(
      <ParticipationActivite objet="la session" inscription={null} choix={[]} inscrire={vi.fn()} desinscrire={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
