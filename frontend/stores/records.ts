import { defineStore } from 'pinia'
import type { TransferRecord, TransferRecordCreate, TransferRecordUpdate, Quotation, QuotationCreate, FinanceDoc, VehicleProfile, ExceptionItem } from '~/types'

export const useRecordsStore = defineStore('records', {
  state: () => ({
    records: [] as TransferRecord[],
    currentRecord: null as TransferRecord | null,
    quotations: [] as Quotation[],
    financeDoc: null as FinanceDoc | null,
    vehicleProfile: null as VehicleProfile | null,
    exceptions: [] as ExceptionItem[],
    loading: false,
    error: null as string | null,
    totalCount: 0,
  }),
  actions: {
    async fetchRecords(params: Record<string, string | number> = {}) {
      const api = useApi()
      this.loading = true
      this.error = null
      try {
        const response = await api.getRecords(params)
        this.records = response.results
        this.totalCount = response.count
      } catch (e: any) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    async fetchRecord(id: string) {
      const api = useApi()
      this.loading = true
      this.error = null
      try {
        this.currentRecord = await api.getRecord(id)
        await Promise.all([
          this.fetchQuotations(id),
          this.fetchFinanceDoc(id),
          this.fetchVehicleProfile(id),
        ])
      } catch (e: any) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    async createRecord(data: TransferRecordCreate) {
      const api = useApi()
      this.loading = true
      this.error = null
      try {
        const record = await api.createRecord(data)
        this.records.unshift(record)
        return record
      } catch (e: any) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
    async updateRecord(id: string, data: TransferRecordUpdate) {
      const api = useApi()
      this.loading = true
      this.error = null
      try {
        const updated = await api.updateRecord(id, data)
        const idx = this.records.findIndex((r) => r.id === id)
        if (idx !== -1) this.records[idx] = updated
        if (this.currentRecord?.id === id) this.currentRecord = updated
        return updated
      } catch (e: any) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
    async submitForReview(id: string) {
      const api = useApi()
      try {
        const updated = await api.submitForReview(id)
        const idx = this.records.findIndex((r) => r.id === id)
        if (idx !== -1) this.records[idx] = updated
        if (this.currentRecord?.id === id) this.currentRecord = updated
        return updated
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
    async approveReview(id: string, note: string) {
      const api = useApi()
      try {
        return await api.approveReview(id, note)
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
    async rejectReview(id: string, note: string) {
      const api = useApi()
      try {
        return await api.rejectReview(id, note)
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
    async fetchQuotations(recordId: string) {
      const api = useApi()
      try {
        this.quotations = await api.getQuotations(recordId)
      } catch (e: any) {
        this.error = e.message
      }
    },
    async addQuotation(recordId: string, data: QuotationCreate) {
      const api = useApi()
      try {
        const q = await api.addQuotation(recordId, data)
        this.quotations.push(q)
        return q
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
    async fetchFinanceDoc(recordId: string) {
      const api = useApi()
      try {
        this.financeDoc = await api.getFinanceDoc(recordId)
      } catch (e: any) {
        if (e.message?.includes('404')) {
          this.financeDoc = null
        } else {
          this.error = e.message
        }
      }
    },
    async updateFinanceDoc(recordId: string, data: Partial<FinanceDoc>) {
      const api = useApi()
      try {
        this.financeDoc = await api.updateFinanceDoc(recordId, data)
        return this.financeDoc
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
    async fetchVehicleProfile(recordId: string) {
      const api = useApi()
      try {
        this.vehicleProfile = await api.getVehicleProfile(recordId)
      } catch (e: any) {
        if (e.message?.includes('404')) {
          this.vehicleProfile = null
        } else {
          this.error = e.message
        }
      }
    },
    async updateVehicleProfile(recordId: string, data: Partial<VehicleProfile>) {
      const api = useApi()
      try {
        this.vehicleProfile = await api.updateVehicleProfile(recordId, data)
        return this.vehicleProfile
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
    async fetchExceptions(params: Record<string, string> = {}) {
      const api = useApi()
      this.loading = true
      try {
        const response = await api.getExceptions(params)
        this.exceptions = response.results
      } catch (e: any) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    async updateException(id: string, data: Partial<ExceptionItem>) {
      const api = useApi()
      try {
        return await api.updateException(id, data)
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
    async addExceptionNote(id: string, content: string) {
      const api = useApi()
      try {
        return await api.addExceptionNote(id, content)
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
    async addReviewTag(recordId: string, tagName: string) {
      const api = useApi()
      try {
        return await api.addReviewTag(recordId, tagName)
      } catch (e: any) {
        this.error = e.message
        throw e
      }
    },
  },
})
