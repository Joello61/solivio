import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchField } from "@/components/ui/search-field";

describe("SearchField", () => {
  it("n'affiche le bouton d'effacement que lorsqu'une recherche est saisie", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<SearchField label="Rechercher" value="" onValueChange={onValueChange} />);
    expect(screen.queryByRole("button", { name: "Effacer la recherche" })).toBeNull();

    rerender(<SearchField label="Rechercher" value="ami" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Effacer la recherche" }));
    expect(onValueChange).toHaveBeenCalledWith("");
  });
});
