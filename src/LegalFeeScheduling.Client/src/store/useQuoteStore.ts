import { create } from 'zustand'
import {
  Quote,
  QuoteItem,
  PaymentRecord,
  ReconciliationRecord,
  AmountCheckResult,
} from '../types'

interface QuoteStore {
  currentQuote: Quote | null
  setCurrentQuote: (quote: Quote | null) => void
  loadQuote: (quoteId: string, fetchFn: (id: string) => Promise<Quote>) => Promise<void>
  updateQuoteItems: (items: QuoteItem[]) => void
  updateQuoteBasic: (data: Partial<Quote>) => void
  clearCurrentQuote: () => void

  payments: PaymentRecord[]
  setPayments: (payments: PaymentRecord[]) => void
  addPayment: (payment: PaymentRecord) => void

  reconciliations: ReconciliationRecord[]
  setReconciliations: (reconciliations: ReconciliationRecord[]) => void
  addReconciliation: (reconciliation: ReconciliationRecord) => void
  updateReconciliation: (reconciliation: ReconciliationRecord) => void

  amountChecks: AmountCheckResult[]
  setAmountChecks: (checks: AmountCheckResult[]) => void
  addAmountCheck: (check: AmountCheckResult) => void
}

export const useQuoteStore = create<QuoteStore>((set) => ({
  currentQuote: null,

  setCurrentQuote: (quote) => set({ currentQuote: quote }),

  loadQuote: async (quoteId, fetchFn) => {
    try {
      const quote = await fetchFn(quoteId)
      set({ currentQuote: quote })
    } catch (error) {
      console.error('Failed to load quote:', error)
      throw error
    }
  },

  updateQuoteItems: (items) =>
    set((state) => {
      if (!state.currentQuote) return state
      const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
      return {
        currentQuote: {
          ...state.currentQuote,
          items,
          amount: subtotal,
        },
      }
    }),

  updateQuoteBasic: (data) =>
    set((state) => {
      if (!state.currentQuote) return state
      return {
        currentQuote: {
          ...state.currentQuote,
          ...data,
        },
      }
    }),

  clearCurrentQuote: () =>
    set({
      currentQuote: null,
      payments: [],
      reconciliations: [],
      amountChecks: [],
    }),

  payments: [],

  setPayments: (payments) => set({ payments }),

  addPayment: (payment) =>
    set((state) => ({
      payments: [...state.payments, payment],
    })),

  reconciliations: [],

  setReconciliations: (reconciliations) => set({ reconciliations }),

  addReconciliation: (reconciliation) =>
    set((state) => ({
      reconciliations: [...state.reconciliations, reconciliation],
    })),

  updateReconciliation: (reconciliation) =>
    set((state) => ({
      reconciliations: state.reconciliations.map((r) =>
        r.id === reconciliation.id ? reconciliation : r
      ),
    })),

  amountChecks: [],

  setAmountChecks: (checks) => set({ amountChecks: checks }),

  addAmountCheck: (check) =>
    set((state) => ({
      amountChecks: [...state.amountChecks, check],
    })),
}))
