import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "@/components/ui/segmented-control";

describe("SegmentedControl", () => {
  it("indique le choix actif et transmet le nouveau choix", () => {
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        label="Distributions affichées"
        value="venir"
        onValueChange={onValueChange}
        options={[
          { value: "venir", label: "À venir", count: 3 },
          { value: "passees", label: "Passées" },
        ]}
      />,
    );
    expect(screen.getByRole("group", { name: "Distributions affichées" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "À venir 3" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Passées" }));
    expect(onValueChange).toHaveBeenCalledWith("passees");
  });
});
