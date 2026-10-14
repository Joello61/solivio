import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageIntrouvable } from "@/components/layout/EtatPage";
import { PageErreur } from "@/components/layout/PageErreur";

describe("PageIntrouvable", () => {
  it("propose de revenir en arriere", () => {
    render(<PageIntrouvable retour="/dashboard" libelleRetour="Retour à l'accueil" />);
    expect(screen.getByRole("heading", { name: "Page introuvable" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à l'accueil" })).toHaveAttribute("href", "/dashboard");
  });
});

describe("PageErreur", () => {
  it("cache le message technique, donne la reference et permet de reessayer", () => {
    const retry = vi.fn();
    const erreur = Object.assign(new Error("SQL: select * from personne"), { digest: "abc123" });
    render(<PageErreur error={erreur} retry={retry} retour="/" libelleRetour="Retour à l'accueil" />);

    expect(screen.queryByText(/select/)).not.toBeInTheDocument();
    expect(screen.getByText("Référence : abc123")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
