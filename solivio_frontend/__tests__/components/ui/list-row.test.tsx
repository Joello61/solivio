import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { List, ListRow } from "@/components/ui/list-row";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe("ListRow", () => {
  it("devient un lien quand une destination est donnee", () => {
    render(
      <List>
        <ListRow titre="Jeudi 22 octobre" sousTitre="17:30 - 19:30" href="/distributions/1" />
        <ListRow titre="Amina Diallo" />
      </List>,
    );
    expect(screen.getByRole("link", { name: /Jeudi 22 octobre/ })).toHaveAttribute("href", "/distributions/1");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
