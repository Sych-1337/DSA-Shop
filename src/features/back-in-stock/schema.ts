import { z } from "zod";

export const backInStockSubscribeSchema = z.object({
  email: z.string().trim().email().max(200),
  productId: z.string().min(1),
  variantId: z.string().min(1),
  locale: z.enum(["uk", "en", "ru"]).default("uk"),
});
