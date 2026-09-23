import { z } from "zod";
import { searchBooking } from "../zoho/dealsService";
import { BOOKING_STAGE } from "../../types/zoho";
import type { ToolDefinition } from "../../types/agent";

export const searchBookingArgsSchema = z
  .object({
    phone: z.string().min(6).optional(),
    bookingId: z.string().min(1).optional(),
  })
  .refine((val) => val.phone || val.bookingId, { message: "Provide either phone or bookingId" });

export const searchBookingTool: ToolDefinition = {
  type: "function",
  function: {
    name: "search_booking",
    description:
      `Look up a booked vehicle's allocation/delivery status by phone number or Booking ID. Only ` +
      `returns a result once the deal has actually reached the '${BOOKING_STAGE}' stage.`,
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string", description: "The customer's phone number" },
        bookingId: { type: "string", description: "The Booking ID, if the customer gave one instead of a phone" },
      },
      required: [],
      additionalProperties: false,
    },
  },
};

export async function handleSearchBooking(rawArgs: unknown) {
  const args = searchBookingArgsSchema.parse(rawArgs);
  const booking = await searchBooking(args);

  if (!booking) {
    return {
      found: false,
      message: `No booking at the ${BOOKING_STAGE} stage found for that phone number / Booking ID.`,
    };
  }

  return {
    found: true,
    bookingId: booking.Booking_Id ?? booking.id,
    allocationStage: booking.Allocation_Stage ?? null,
    vin: booking.VIN ?? null,
    paymentLink: booking.Payment_Link ?? null,
  };
}
