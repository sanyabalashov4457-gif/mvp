import { errorResponse, successResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const result = stores.map((store) => ({
      id: store.id,
      slug: store.slug,
      name: store.name,
      city: store.city,
      area: store.area,
      description: store.description,
      story: store.story,
      imageUrl: store.imageUrl,
      createdAt: store.createdAt.toISOString(),
      updatedAt: store.updatedAt.toISOString(),
      itemsCount: store._count.items,
    }));

    return successResponse(result);
  } catch (error) {
    console.error("GET /api/stores failed", error);
    return errorResponse("Failed to load stores.", 500);
  }
}
