import { z } from "zod";

import { ShippingMethod } from "@/generated/prisma";

export const checkoutSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(8).max(32),
  city: z.string().min(1).max(120),
  shippingMethod: z.nativeEnum(ShippingMethod).default(ShippingMethod.WAREHOUSE),
  warehouseRef: z.string().max(240).optional(),
  addressLine: z.string().max(240).optional(),
  /** Soft launch: prepaid only — FOP transfer or online (WayForPay). No COD. */
  paymentMethod: z.enum(["ONLINE", "BANK_TRANSFER"]).default("BANK_TRANSFER"),
  customerNote: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(8).max(80),
  couponCode: z.string().max(40).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
