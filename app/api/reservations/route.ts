import { ItemStatus } from "@prisma/client";

import { errorResponse, successResponse } from "@/lib/api-response";
import { mapReservation } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";

type ReservationInput = {
  itemId?: unknown;
  customerName?: unknown;
  contact?: unknown;
  message?: unknown;
};

const asOptionalTrimmedString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReservationInput;
    const itemId = asOptionalTrimmedString(payload.itemId);

    if (!itemId) {
      return errorResponse("itemId is required.", 400);
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });

    if (!item) {
      return errorResponse("Item not found.", 404);
    }

    if (item.status === ItemStatus.SOLD) {
      return errorResponse("This item has already been sold.", 400);
    }

    const reservation = await prisma.$transaction(async (tx) => {
      const createdReservation = await tx.reservation.create({
        data: {
          itemId,
          customerName: asOptionalTrimmedString(payload.customerName),
          contact: asOptionalTrimmedString(payload.contact),
          message: asOptionalTrimmedString(payload.message),
        },
      });

      if (item.status === ItemStatus.AVAILABLE) {
        await tx.item.update({
          where: { id: item.id },
          data: { status: ItemStatus.RESERVED },
        });
      }

      return createdReservation;
    });

    return successResponse(mapReservation(reservation), 201);
  } catch (error) {
    console.error("POST /api/reservations failed", error);
    return errorResponse("Failed to create reservation.", 500);
  }
}
