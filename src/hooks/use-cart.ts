"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, ProductVariant } from "@/types";

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, size: string, color: string, variantId?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

const getCartItemKey = (
  productId: string,
  size: string,
  color: string,
  variantId?: string
) => `${productId}-${variantId ?? "no-variant"}-${size}-${color}`;

const getCartItemPrice = (product: Product, variant?: ProductVariant) =>
  variant?.sale_price ?? variant?.price ?? product.sale_price ?? product.price;

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, size, color, variantId) => {
        set((state) => {
          const variant = product.variants?.find(
            (productVariant) => productVariant.id === variantId
          );
          const itemKey = getCartItemKey(product.id, size, color, variantId);

          const existingIndex = state.items.findIndex(
            (item) => item.id === itemKey
          );

          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }

          const newItem: CartItem = {
            id: itemKey,
            product_id: product.id,
            product,
            variant_id: variantId,
            variant,
            quantity,
            size,
            color,
            price: getCartItemPrice(product, variant),
          };

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "wildsoul-cart",
      skipHydration: true,
    }
  )
);
