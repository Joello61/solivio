import { describe, expect, it } from "vitest";
import { cheminDeRetourSur } from "@/lib/redirection";

const ORIGINE = "https://solivio.app";

describe("cheminDeRetourSur", () => {
  it.each([
    ["/\\evil.com"],
    ["//evil.com"],
    ["/\t/evil.com"],
    ["https://evil.com"],
    ["javascript:alert(1)"],
    ["evil.com"],
    [""],
  ])("refuse %j et renvoie au tableau de bord", (brut) => {
    expect(cheminDeRetourSur(brut, ORIGINE)).toBe("/dashboard");
  });

  it("renvoie au tableau de bord sans parametre", () => {
    expect(cheminDeRetourSur(null, ORIGINE)).toBe("/dashboard");
  });

  it("conserve un chemin interne et sa requete", () => {
    expect(cheminDeRetourSur("/distributions/1?x=2", ORIGINE)).toBe("/distributions/1?x=2");
  });

  // Encode, l'antislash reste dans le chemin : la redirection ne quitte pas l'application.
  it("garde un antislash encode dans le chemin", () => {
    expect(cheminDeRetourSur("/%5Cevil.com", ORIGINE)).toBe("/%5Cevil.com");
  });
});
