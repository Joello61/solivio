import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChampCode, CODE_VIDE, codeComplet } from "@/components/auth/ChampCode";

function Champ() {
  const [chiffres, setChiffres] = useState(CODE_VIDE);
  return (
    <>
      <ChampCode chiffres={chiffres} onChange={setChiffres} />
      <output>{codeComplet(chiffres) ? "complet" : "incomplet"}</output>
    </>
  );
}

describe("ChampCode", () => {
  it("accepte le collage du code entier", () => {
    render(<Champ />);
    fireEvent.paste(screen.getByLabelText("Chiffre 1"), {
      clipboardData: { getData: () => "Code : 482 913" },
    });
    expect(screen.getByLabelText("Chiffre 6")).toHaveValue("3");
    expect(screen.getByText("complet")).toBeInTheDocument();
  });

  it("ignore ce qui n'est pas un chiffre", () => {
    render(<Champ />);
    fireEvent.change(screen.getByLabelText("Chiffre 1"), { target: { value: "a" } });
    expect(screen.getByLabelText("Chiffre 1")).toHaveValue("");
    expect(screen.getByText("incomplet")).toBeInTheDocument();
  });

  it("passe a la case suivante apres un chiffre", () => {
    render(<Champ />);
    fireEvent.change(screen.getByLabelText("Chiffre 1"), { target: { value: "4" } });
    expect(screen.getByLabelText("Chiffre 2")).toHaveFocus();
  });

  it("est nomme pour les lecteurs d'ecran", () => {
    render(<Champ />);
    expect(screen.getByRole("group", { name: "Code de vérification" })).toBeInTheDocument();
  });
});
