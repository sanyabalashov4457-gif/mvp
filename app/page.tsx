import { DiscoverClient } from "@/components/DiscoverClient";
import { mapItemsWithStore } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const items = await prisma.item.findMany({
    where: {
      status: "AVAILABLE",
    },
    include: {
      store: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <DiscoverClient items={mapItemsWithStore(items)} />;
}
