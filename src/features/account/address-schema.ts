import { z } from "zod";

import { ShippingMethod } from "@/generated/prisma";

export const customerAddressSchema = z
  .object({
    label: z.string().trim().min(1).max(60).default("Доставка"),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().min(5).max(40),
    email: z.string().trim().email().optional().or(z.literal("")),
    city: z.string().trim().min(1).max(120),
    cityRef: z.string().trim().max(80).optional().or(z.literal("")),
    shippingMethod: z.nativeEnum(ShippingMethod),
    warehouseRef: z.string().trim().max(200).optional().or(z.literal("")),
    addressLine: z.string().trim().max(200).optional().or(z.literal("")),
    isDefault: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.shippingMethod === ShippingMethod.ADDRESS) {
      if (!value.addressLine?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["addressLine"],
          message: "ADDRESS_REQUIRED",
        });
      }
    } else if (!value.warehouseRef?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["warehouseRef"],
        message: "WAREHOUSE_REQUIRED",
      });
    }
  });

export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;
