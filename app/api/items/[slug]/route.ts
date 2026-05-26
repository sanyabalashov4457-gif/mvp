import { errorResponse, successResponse } from "@/lib/api-response";
import { mapItemWithStore } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

type ItemRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_: Request, context: ItemRouteContext) {
  try {
    const { slug } = await context.params;

    const item = await prisma.item.findUnique({
      where: { slug },
      include: { store: true },
    });

    if (!item) {
      return errorResponse("Item not found.", 404);
    }

    return successResponse(mapItemWithStore(item));
  } catch (error) {
    console.error("GET /api/items/[slug] failed", error);
    return errorResponse("Failed to load item.", 500);
  }
}
