"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  thumbnailUrl?: string;
}

interface WishlistStore {
  items: WishlistItem[];
  hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  toggleItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  hasItem: (id: string) => boolean;
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      toggleItem: (item) =>
        set((state) => ({
          items: state.items.some((candidate) => candidate.id === item.id)
            ? state.items.filter((candidate) => candidate.id !== item.id)
            : [...state.items, item],
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      hasItem: (id) => get().items.some((item) => item.id === id),
    }),
    {
      name: "wildsoul-wishlist",
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
