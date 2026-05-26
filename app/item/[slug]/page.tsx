import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ItemActions } from "@/components/ItemActions";
import { formatPrice } from "@/lib/format";
import { getConditionLabel } from "@/lib/item-labels";
import { mapItemWithStore } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

type ItemPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await prisma.item.findUnique({ where: { slug }, include: { store: true } });

  return {
    title: item ? `${item.brand} ${item.title} · SecondPlace` : "Вещь · SecondPlace",
    description:
      item?.description ?? "Отобранная винтажная находка в SecondPlace.",
  };
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { slug } = await params;
  const prismaItem = await prisma.item.findUnique({
    where: { slug },
    include: { store: true },
  });

  if (!prismaItem) {
    notFound();
  }

  const item = mapItemWithStore(prismaItem);

  const metadataRows = [
    { label: "Магазин", value: item.store.name },
    {
      label: "Город",
      value: item.store.area
        ? `${item.store.city}, ${item.store.area}`
        : item.store.city,
    },
    { label: "Размер", value: item.size },
    { label: "Состояние", value: getConditionLabel(item.condition) },
    { label: "Материал", value: item.material ?? "Не указано" },
    { label: "Цвет", value: item.color ?? "Не указано" },
    { label: "Эпоха", value: item.era ?? "Не указано" },
    { label: "Посадка", value: item.fit ?? "Не указано" },
    {
      label: "Замеры",
      value: item.measurements ?? "Не указано",
    },
  ];

  return (
    <AppShell>
      <div className="-mx-5 -mt-6">
        <div className="relative aspect-[3/4] overflow-hidden rounded-b-[34px] border-b border-border">
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? `${item.brand} ${item.title}`}
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
            Назад
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

        {item.curatorNote ? (
          <div className="rounded-3xl border border-border bg-card px-4 py-4">
            <h2 className="text-xs uppercase tracking-[0.12em] text-muted">Заметка куратора</h2>
            <p className="mt-2 text-sm leading-relaxed text-primary">{item.curatorNote}</p>
          </div>
        ) : null}

        <div>
          <h2 className="text-xs uppercase tracking-[0.12em] text-muted">Описание</h2>
          <p className="mt-2 text-sm leading-relaxed text-primary">{item.description}</p>
        </div>

        <ItemActions itemId={item.id} itemSlug={item.slug} />
      </section>
    </AppShell>
  );
}
