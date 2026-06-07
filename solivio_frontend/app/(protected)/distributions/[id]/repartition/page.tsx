import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { RepartitionPanel } from "@/components/repartition/RepartitionPanel";
import type { DistributionResponse, DenreeResponse, DotationResponse } from "@/types/distribution";

export const metadata: Metadata = { title: "Repartition des denrees" };

async function fetchData(id: string, cookieHeader: string) {
  const base = process.env.API_URL ?? "http://localhost:8080";
  const h = { Cookie: cookieHeader };

  const [distribRes, denreesRes, dotationRes] = await Promise.all([
    fetch(`${base}/api/distributions/${id}`, { headers: h, cache: "no-store" }),
    fetch(`${base}/api/distributions/${id}/denrees`, { headers: h, cache: "no-store" }),
    fetch(`${base}/api/distributions/${id}/repartition`, { headers: h, cache: "no-store" }),
  ]);

  if (!distribRes.ok || !denreesRes.ok || !dotationRes.ok) return null;

  const distribution = (await distribRes.json()) as DistributionResponse;
  const denrees = (await denreesRes.json()) as DenreeResponse[];
  const dotation = (await dotationRes.json()) as DotationResponse;

  return { distribution, denrees, dotation };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RepartitionPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const data = await fetchData(id, cookieHeader);
  if (!data) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={`/distributions/${id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft className="mr-2 size-4" />
          Retour
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Package className="size-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Repartition des denrees</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <RepartitionPanel
          distributionId={id}
          denreesInitiales={data.denrees}
          dotationInitiale={data.dotation}
          modifiable={data.distribution.statut !== "TERMINEE" && data.distribution.statut !== "ANNULEE"}
        />
      </div>
    </div>
  );
}
