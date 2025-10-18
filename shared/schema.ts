import { z } from "zod";

export const discountSchema = z.object({
  type: z.enum(["bulk_price", "buy_x_get_y"]), // bulk_price: "3 for €10", buy_x_get_y: "3 for 2"
  quantity: z.number(), // Required quantity for discount
  value: z.number(), // For bulk_price: discounted total price, for buy_x_get_y: quantity you pay for
  display: z.string(), // Display text like "(3 for €10)" or "(3 for 2)"
});

export const shoppingItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Item name is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  total: z.number(),
  groupId: z.string().optional(),
  originalQuantity: z.number().optional(), // Store original quantity for splitting
  splitIndex: z.number().optional(), // For tracking which part of split item (1-based)
  discount: discountSchema.optional(), // Multi-purchase discount information
  discountApplied: z.boolean().default(false), // Whether discount is currently applied
  onHold: z.boolean().default(false), // Whether item is on hold (excluded from total)
  isPerKg: z.boolean().default(false), // Whether item is priced per KG
  isSplittable: z.boolean().default(true), // Whether item can be split into groups
  photo: z.string().optional(), // Base64 encoded thumbnail of captured photo
});

export const shoppingGroupSchema = z.object({
  id: z.string(),
  number: z.number(),
  targetAmount: z.number(),
  total: z.number(),
  items: z.array(shoppingItemSchema),
});

export const shoppingListSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "List name is required"),
  date: z.string(),
  items: z.array(shoppingItemSchema),
  groups: z.array(shoppingGroupSchema).optional(),
  total: z.number(),
  isSplitMode: z.boolean().default(false),
});

export type Discount = z.infer<typeof discountSchema>;
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;
export type ShoppingGroup = z.infer<typeof shoppingGroupSchema>;
export type ShoppingList = z.infer<typeof shoppingListSchema>;

export const insertShoppingItemSchema = shoppingItemSchema.omit({
  id: true,
  total: true,
});

export type InsertShoppingItem = z.infer<typeof insertShoppingItemSchema>;
