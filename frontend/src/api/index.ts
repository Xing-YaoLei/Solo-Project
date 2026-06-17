import { request } from './client'
import {
  Contract,
  ContractAttachment,
  ReconciliationDiff,
  Bill,
  BillItem,
  ApprovalNode,
  ApprovalRecord,
  ExceptionOrder,
  ExceptionAffectedObject,
  StatusTimeline,
  ExportRecord,
  AmountValidationRequest,
  AmountValidationResult,
  ExportRequest,
  User,
  Token,
  UserLogin,
  PaginatedData,
  PaginationParams,
} from '@/types'

export const authApi = {
  login: (data: UserLogin) => request.post<Token>('/auth/login', data),
  register: (data: any) => request.post<Token>('/auth/register', data),
  getCurrentUser: () => request.get<User>('/auth/me'),
}

export const contractApi = {
  getList: (params?: PaginationParams) =>
    request.get<PaginatedData<Contract>>('/contracts', { params }),
  getDetail: (id: number) => request.get<Contract>(`/contracts/${id}`),
  create: (data: Partial<Contract>) => request.post<Contract>('/contracts', data),
  update: (id: number, data: Partial<Contract>) => request.put<Contract>(`/contracts/${id}`, data),
  delete: (id: number) => request.delete(`/contracts/${id}`),
  getAttachments: (id: number) =>
    request.get<ContractAttachment[]>(`/contracts/${id}/attachments`),
  uploadAttachment: (id: number, formData: FormData) =>
    request.upload<ContractAttachment>(`/contracts/${id}/attachments`, formData),
  downloadAttachment: (id: number, attId: number) =>
    request.download(`/contracts/${id}/attachments/${attId}/download`),
  deleteAttachment: (id: number, attId: number) =>
    request.delete(`/contracts/${id}/attachments/${attId}`),
}

export const reconciliationApi = {
  getList: (params?: PaginationParams) =>
    request.get<PaginatedData<ReconciliationDiff>>('/reconciliation', { params }),
  getDetail: (id: number) => request.get<ReconciliationDiff>(`/reconciliation/${id}`),
  create: (data: Partial<ReconciliationDiff>) =>
    request.post<ReconciliationDiff>('/reconciliation', data),
  update: (id: number, data: Partial<ReconciliationDiff>) =>
    request.put<ReconciliationDiff>(`/reconciliation/${id}`, data),
  delete: (id: number) => request.delete(`/reconciliation/${id}`),
  handle: (id: number, data: { status: string; handler_conclusion: string }) =>
    request.post<ReconciliationDiff>(`/reconciliation/${id}/handle`, data),
  getByContract: (contractId: number) =>
    request.get<ReconciliationDiff[]>(`/reconciliation/contract/${contractId}`),
}

export const billApi = {
  getList: (params?: PaginationParams) =>
    request.get<PaginatedData<Bill>>('/bills', { params }),
  getDetail: (id: number) => request.get<Bill>(`/bills/${id}`),
  create: (data: Partial<Bill> & { items?: Partial<BillItem>[] }) =>
    request.post<Bill>('/bills', data),
  update: (id: number, data: Partial<Bill>) => request.put<Bill>(`/bills/${id}`, data),
  delete: (id: number) => request.delete(`/bills/${id}`),
  getItems: (id: number) => request.get<BillItem[]>(`/bills/${id}/items`),
  addItem: (id: number, data: Partial<BillItem>) =>
    request.post<BillItem>(`/bills/${id}/items`, data),
  updateItem: (id: number, itemId: number, data: Partial<BillItem>) =>
    request.put<BillItem>(`/bills/${id}/items/${itemId}`, data),
  deleteItem: (id: number, itemId: number) =>
    request.delete(`/bills/${id}/items/${itemId}`),
  validateAmount: (id: number) =>
    request.get<AmountValidationResult>(`/bills/${id}/validate`),
}

export const approvalApi = {
  getNodes: (params?: PaginationParams) =>
    request.get<PaginatedData<ApprovalNode>>('/approval/nodes', { params }),
  createNode: (data: Partial<ApprovalNode>) =>
    request.post<ApprovalNode>('/approval/nodes', data),
  updateNode: (id: number, data: Partial<ApprovalNode>) =>
    request.put<ApprovalNode>(`/approval/nodes/${id}`, data),
  deleteNode: (id: number) => request.delete(`/approval/nodes/${id}`),
  getRecords: (params?: PaginationParams) =>
    request.get<PaginatedData<ApprovalRecord>>('/approval/records', { params }),
  getRecordsByBill: (billId: number) =>
    request.get<ApprovalRecord[]>(`/approval/bill/${billId}/records`),
  createRecord: (data: Partial<ApprovalRecord>) =>
    request.post<ApprovalRecord>('/approval/records', data),
  approve: (id: number, data: { approval_opinion?: string }) =>
    request.post<ApprovalRecord>(`/approval/records/${id}/approve`, data),
  reject: (id: number, data: { approval_opinion?: string }) =>
    request.post<ApprovalRecord>(`/approval/records/${id}/reject`, data),
}

export const exceptionApi = {
  getList: (params?: PaginationParams) =>
    request.get<PaginatedData<ExceptionOrder>>('/exceptions', { params }),
  getDetail: (id: number) => request.get<ExceptionOrder>(`/exceptions/${id}`),
  create: (data: Partial<ExceptionOrder> & { affected_objects?: Partial<ExceptionAffectedObject>[] }) =>
    request.post<ExceptionOrder>('/exceptions', data),
  update: (id: number, data: Partial<ExceptionOrder>) =>
    request.put<ExceptionOrder>(`/exceptions/${id}`, data),
  delete: (id: number) => request.delete(`/exceptions/${id}`),
  close: (id: number, data: { final_conclusion: string }) =>
    request.post<ExceptionOrder>(`/exceptions/${id}/close`, data),
  getAffectedObjects: (id: number) =>
    request.get<ExceptionAffectedObject[]>(`/exceptions/${id}/affected-objects`),
  addAffectedObject: (id: number, data: Partial<ExceptionAffectedObject>) =>
    request.post<ExceptionAffectedObject>(`/exceptions/${id}/affected-objects`, data),
  updateAffectedObject: (id: number, objId: number, data: Partial<ExceptionAffectedObject>) =>
    request.put<ExceptionAffectedObject>(`/exceptions/${id}/affected-objects/${objId}`, data),
  deleteAffectedObject: (id: number, objId: number) =>
    request.delete(`/exceptions/${id}/affected-objects/${objId}`),
}

export const timelineApi = {
  getList: (params?: PaginationParams) =>
    request.get<PaginatedData<StatusTimeline>>('/timelines', { params }),
  getByContract: (contractId: number) =>
    request.get<StatusTimeline[]>(`/timelines/contract/${contractId}`),
  getByBill: (billId: number) => request.get<StatusTimeline[]>(`/timelines/bill/${billId}`),
  getByReconciliation: (diffId: number) =>
    request.get<StatusTimeline[]>(`/timelines/reconciliation/${diffId}`),
  getByException: (exceptionId: number) =>
    request.get<StatusTimeline[]>(`/timelines/exception/${exceptionId}`),
}

export const validationApi = {
  validateAmount: (data: AmountValidationRequest) =>
    request.post<AmountValidationResult>('/validation/amount', data),
  validateAndCreateException: (data: AmountValidationRequest) =>
    request.post<ExceptionOrder>('/validation/amount/create-exception', data),
  validateBill: (billId: number) =>
    request.post<AmountValidationResult>(`/validation/bill/${billId}`),
  batchValidateContractBills: (contractId: number) =>
    request.post<AmountValidationResult[]>(`/validation/contract/${contractId}/bills`),
  getThreshold: () => request.get<{ threshold: number }>('/validation/threshold'),
}

export const exportApi = {
  exportData: (data: ExportRequest) =>
    request.download('/exports', {}, 'POST', data),
  getExportTypes: () =>
    request.get<{ type: string; name: string }[]>('/exports/types'),
  getExportRecords: (params?: PaginationParams) =>
    request.get<PaginatedData<ExportRecord>>('/exports/records', { params }),
  getExportRecord: (id: number) => request.get<ExportRecord>(`/exports/records/${id}`),
  downloadExport: (id: number) =>
    request.download(`/exports/records/${id}/download`),
  deleteExportRecord: (id: number) => request.delete(`/exports/records/${id}`),
}
