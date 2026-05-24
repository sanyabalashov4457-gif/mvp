import { ItemStatus, Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/lib/api-response";
import { mapItemsWithStore } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

const itemStatusValues = new Set<string>(Object.values(ItemStatus));

const parseStatus = (statusParam: string | null) => {
  if (!statusParam) {
    return ItemStatus.AVAILABLE;
  }

  const normalized = statusParam.toUpperCase();
  if (normalized === "ALL") {
    return null;
  }

  if (!itemStatusValues.has(normalized)) {
    return undefined;
  }

  return normalized as ItemStatus;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = parseStatus(searchParams.get("status"));

    if (typeof status === "undefined") {
      return errorResponse(
        "Invalid status value. Use AVAILABLE, RESERVED, SOLD or ALL.",
        400,
      );
    }

    const category = searchParams.get("category")?.trim();
    const city = searchParams.get("city")?.trim();
    const query = searchParams.get("q")?.trim();
    const slugs =
      searchParams
        .get("slugs")
        ?.split(",")
        .map((slug) => slug.trim())
        .filter(Boolean) ?? [];

    const where: Prisma.ItemWhereInput = {
      ...(status ? { status } : {}),
      ...(category
        ? {
            category: {
              equals: category,
              mode: "insensitive",
            },
          }
        : {}),
      ...(city
        ? {
            store: {
              city: {
                equals: city,
                mode: "insensitive",
              },
            },
          }
        : {}),
      ...(slugs.length > 0
        ? {
            slug: {
              in: slugs,
            },
          }
        : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { brand: { contains: query, mode: "insensitive" } },
              { category: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              {
                store: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const items = await prisma.item.findMany({
      where,
      include: {
        store: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return successResponse(mapItemsWithStore(items));
  } catch (error) {
    console.error("GET /api/items failed", error);
    return errorResponse("Failed to load items.", 500);
  }
}
