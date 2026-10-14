import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalogue } from "./Catalogue";

export const metadata: Metadata = { title: "Système de design" };

/* Catalogue des primitives, reserve au developpement : base des captures visuelles. */
export default function PageDesign() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <Catalogue />
    </main>
  );
}
