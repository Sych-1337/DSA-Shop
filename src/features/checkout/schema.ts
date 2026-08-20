import { z } from "zod";

import { PaymentMethod, ShippingMethod } from "@/generated/prisma";

export const checkoutSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  phone: z.string().min(8).max(32),
  city: z.string().min(1).max(120),
  shippingMethod: z.nativeEnum(ShippingMethod).default(ShippingMethod.WAREHOUSE),
  warehouseRef: z.string().max(240).optional(),
  addressLine: z.string().max(240).optional(),
  /** Store policy: full prepaid online only — no COD / cash on delivery. */
  paymentMethod: z.literal(PaymentMethod.ONLINE).default(PaymentMethod.ONLINE),
  customerNote: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(8).max(80),
  couponCode: z.string().max(40).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
