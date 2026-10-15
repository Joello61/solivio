import { render, screen } from "@testing-library/react";
import { Users } from "lucide-react";
import { describe, expect, it } from "vitest";
import { BandeauAccueil } from "@/components/accueil/BandeauAccueil";
import { Initiales } from "@/components/ui/initiales";
import { Stat } from "@/components/ui/stat";
import { PHOTOS } from "@/lib/photos";

describe("BandeauAccueil", () => {
  it("salue, date le jour et montre ce qui se passe aujourd'hui", () => {
    render(
      <BandeauAccueil surtitre="jeudi 15 octobre" titre="Bonjour Paul" description="Prochain rendez-vous jeudi." photo={PHOTOS.colis}>
        <p>Distribution du jour</p>
      </BandeauAccueil>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Bonjour Paul" })).toBeInTheDocument();
    expect(screen.getByText("jeudi 15 octobre")).toBeInTheDocument();
    expect(screen.getByText("Distribution du jour")).toBeInTheDocument();
    // La photo du bandeau est un decor : elle n'est pas annoncee.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("Stat", () => {
  it("garde le chiffre et son libelle lisibles, l'icone en decor", () => {
    const { container } = render(<Stat icone={Users} ton="jaune" valeur={10} libelle="bénévoles mobilisés" />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("bénévoles mobilisés")).toBeInTheDocument();
    expect(container.querySelector("[aria-hidden='true'] svg")).not.toBeNull();
  });
});

describe("Initiales", () => {
  it("affiche les initiales du prenom et du nom, sans les annoncer", () => {
    render(<Initiales prenom="alice" nom="Dupont" />);
    const pastille = screen.getByText("AD");
    expect(pastille).toHaveAttribute("aria-hidden", "true");
  });
});
