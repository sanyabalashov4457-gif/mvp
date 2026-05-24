import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ItemActions } from "@/components/ItemActions";
import { getItemById } from "@/data/items";
import { formatPrice } from "@/lib/format";

type ItemPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = getItemById(id);

  return {
    title: item ? `${item.brand} ${item.title} · SecondPlace` : "Item · SecondPlace",
    description:
      item?.description ?? "Curated second-hand fashion find on SecondPlace.",
  };
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params;
  const item = getItemById(id);

  if (!item) {
    notFound();
  }

  const metadataRows = [
    { label: "Size", value: item.size },
    { label: "Condition", value: item.condition },
    { label: "City", value: item.city },
    { label: "Store", value: item.storeName },
    { label: "Material", value: item.material ?? "Not specified" },
    { label: "Color", value: item.color ?? "Not specified" },
    { label: "Category", value: item.category },
  ];

  return (
    <AppShell>
      <div className="-mx-5 -mt-6">
        <div className="relative aspect-[3/4] overflow-hidden rounded-b-[34px] border-b border-border">
          <Image
            src={item.imageUrl}
            alt={`${item.brand} ${item.title}`}
            fill
            sizes="(max-width: 430px) 100vw, 430px"
            className="object-cover"
            priority
          />

          <Link
            href="/"
            className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-background/55 bg-background/90 px-3 py-2 text-xs font-medium text-primary backdrop-blur"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </div>

      <section className="mt-6 space-y-5">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.15em] text-muted">
            {item.brand}
          </p>
          <h1 className="mt-1 text-[2rem] font-semibold leading-tight tracking-tight text-primary">
            {item.title}
          </h1>
          <p className="mt-4 text-[1.75rem] font-semibold tracking-tight text-primary">
            {formatPrice(item.price, item.currency)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-3xl border border-border bg-card p-4">
          {metadataRows.map((row) => (
            <div key={row.label}>
              <dt className="text-[0.68rem] uppercase tracking-[0.12em] text-muted">
                {row.label}
              </dt>
              <dd className="mt-1 text-sm text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <h2 className="text-xs uppercase tracking-[0.12em] text-muted">Description</h2>
          <p className="mt-2 text-sm leading-relaxed text-primary">{item.description}</p>
        </div>

        <ItemActions itemId={item.id} />
      </section>
    </AppShell>
  );
}
