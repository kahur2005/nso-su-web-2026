'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartLine, LunchMenuItem } from '@/lib/lunch'

/** Generate unique cart line key based on item id and sorted add-on ids. */
function lineKey(menuItemId: string, addOnIds: string[]): string {
  return [menuItemId, ...[...addOnIds].sort()].join('|')
}

interface LunchCartState {
  dayKey: string | null
  restaurantId: string | null
  lines: CartLine[]
  hasHydrated: boolean

  /** Add an item to cart. Return conflict if day or restaurant does not match. */
  addLine: (
    dayKey: string,
    restaurantId: string,
    item: LunchMenuItem,
    quantity: number,
    addOnIds: string[]
  ) => 'added' | 'conflict'
  setQuantity: (key: string, quantity: number) => void
  removeLine: (key: string) => void
  reset: () => void
  setHasHydrated: () => void
}

export const useLunchCart = create<LunchCartState>()(
  persist(
    (set, get) => ({
      dayKey: null,
      restaurantId: null,
      lines: [],
      hasHydrated: false,

      addLine: (dayKey, restaurantId, item, quantity, addOnIds) => {
        const state = get()
        const hasContents = state.lines.length > 0
        if (
          hasContents &&
          (state.dayKey !== dayKey || state.restaurantId !== restaurantId)
        ) {
          return 'conflict'
        }

        const chosen = item.addOns.filter((a) => addOnIds.includes(a.id))
        const key = lineKey(item.id, chosen.map((a) => a.id))
        const existing = state.lines.find((l) => l.key === key)

        set({
          dayKey,
          restaurantId,
          lines: existing
            ? state.lines.map((l) =>
                l.key === key ? { ...l, quantity: l.quantity + quantity } : l
              )
            : [
                ...state.lines,
                {
                  key,
                  menuItemId: item.id,
                  name: item.name,
                  unitPrice: item.price,
                  quantity,
                  addOns: chosen.map((a) => ({
                    id: a.id,
                    name: a.name,
                    price: a.price,
                  })),
                },
              ],
        })
        return 'added'
      },

      setQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeLine(key)
          return
        }
        set({
          lines: get().lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
        })
      },

      removeLine: (key) => {
        const lines = get().lines.filter((l) => l.key !== key)
        // An empty cart carries no day/restaurant, so the next add is never a
        // conflict against a cart the student can no longer see.
        set(
          lines.length === 0
            ? { lines, dayKey: null, restaurantId: null }
            : { lines }
        )
      },

      reset: () => set({ dayKey: null, restaurantId: null, lines: [] }),

      setHasHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'nso-lunch-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        dayKey: s.dayKey,
        restaurantId: s.restaurantId,
        lines: s.lines,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated()
      },
    }
  )
)
