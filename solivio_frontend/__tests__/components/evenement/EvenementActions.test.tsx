import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EvenementActions } from "@/components/evenement/EvenementActions";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/api/evenement", () => ({
  publierEvenement: vi.fn(),
  annulerEvenement: vi.fn(),
  sInscrire: vi.fn(),
  seDesinscrire: vi.fn(),
}));

const base = {
  evenementId: "e1",
  aBesoiNStaff: true,
  ouvertParticipants: false,
  modeInscription: "OBLIGATOIRE" as const,
  estGestionnaire: true,
  estBenevole: false,
  estBeneficiaire: false,
  dejaInscrit: false,
};

describe("EvenementActions", () => {
  it("propose au responsable de modifier et publier un brouillon", () => {
    render(<EvenementActions {...base} statut="BROUILLON" estResponsable />);
    expect(screen.getByRole("link", { name: /Modifier/i })).toHaveAttribute("href", "/evenements/e1/modifier");
    expect(screen.getByRole("button", { name: /Publier/i })).toBeInTheDocument();
  });

  it("ne propose au coordinateur ni modification, ni publication, ni annulation", () => {
    const { container } = render(<EvenementActions {...base} statut="BROUILLON" estResponsable={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("laisse le pointage au coordinateur sur un evenement publie", () => {
    render(<EvenementActions {...base} statut="PUBLIE" estResponsable={false} />);
    expect(screen.getByRole("button", { name: /Pointage/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Annuler/i })).not.toBeInTheDocument();
  });

  it("ne propose plus de modifier un evenement publie", () => {
    render(<EvenementActions {...base} statut="PUBLIE" estResponsable />);
    expect(screen.queryByRole("link", { name: /Modifier/i })).not.toBeInTheDocument();
  });
});
