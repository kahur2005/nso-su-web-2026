// lib/stores/lunchCart.ts
// The lunch cart: a CLIENT-SIDE DRAFT. Nothing here touches the database —
// the order is created in one shot when the student presses Pay, and the
// server re-reads and re-totals every price at that point. Treat the prices
// cached in here as display values only.
//
// The cart holds one day and one restaurant at a time, which is the ordering
// rule the committee settled on: mixing restaurants in a single payment would
// need one QRIS per vendor.
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartLine, LunchMenuItem } from '@/lib/lunch'

/** Two lines with the same item but different add-ons must not merge, so the
 *  identity of a line is the item plus its sorted add-on ids. */
function lineKey(menuItemId: string, addOnIds: string[]): string {
  return [menuItemId, ...[...addOnIds].sort()].join('|')
}

interface LunchCartState {
  dayKey: string | null
  restaurantId: string | null
  lines: CartLine[]
  /** False until the persisted cart has been read back, so the UI can avoid
   *  rendering an empty cart on the server and a full one on the client. */
  hasHydrated: boolean

  /**
   * Adds an item. Returns 'conflict' without changing anything when the cart
   * already holds a different day or restaurant — the caller is expected to
   * ask the student whether to start a new cart, then call `reset` first.
   */
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
      // Only the cart contents persist. hasHydrated is derived, and the actions
      // must come from the creator rather than from stale localStorage.
      partialize: (s) => ({
        dayKey: s.dayKey,
        restaurantId: s.restaurantId,
        lines: s.lines,
      }),
      // Fires after rehydration — including when there was nothing stored, so
      // a first-time visitor is not stuck on a permanent loading state.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated()
      },
    }
  )
)
