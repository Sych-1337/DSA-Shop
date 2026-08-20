import { z } from "zod";

export const wishlistNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(60);

export const MAX_WISHLISTS = 20;
