import { PaymentStatus } from './enums'

export interface Payment {
  id: string
  paymentNumber: string
  paymentType: string
  amount: number
  status: PaymentStatus
  transactionId?: string
  paymentMethod?: string
  paymentDate?: string
  remarks?: string
  createdAt: string
  projectName: string
  projectId: string
  documentNumber?: string
  documentId?: string
  recordedByName: string
  recordedById: string
}

export interface CreatePaymentDto {
  paymentType: string
  amount: number
  transactionId?: string
  paymentMethod?: string
  paymentDate?: string
  remarks?: string
  projectId: string
  documentId?: string
  status: PaymentStatus
}

export interface UpdatePaymentDto {
  paymentType: string
  amount: number
  status: PaymentStatus
  transactionId?: string
  paymentMethod?: string
  paymentDate?: string
  remarks?: string
}
