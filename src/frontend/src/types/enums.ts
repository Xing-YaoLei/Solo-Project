export enum UserRole {
  Owner = 'Owner',
  Designer = 'Designer',
  Foreman = 'Foreman',
  Supervisor = 'Supervisor',
}

export enum DocumentType {
  SiteMeasurement = 'SiteMeasurement',
  Quotation = 'Quotation',
  ChangeOrder = 'ChangeOrder',
  MaterialOrder = 'MaterialOrder',
  PaymentRequest = 'PaymentRequest',
  CompletionAcceptance = 'CompletionAcceptance',
}

export enum DocumentStatus {
  Draft = 'Draft',
  PendingReview = 'PendingReview',
  PendingApproval = 'PendingApproval',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Revised = 'Revised',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum AmountConsistencyStatus {
  Consistent = 'Consistent',
  Inconsistent = 'Inconsistent',
  PendingVerification = 'PendingVerification',
  Resolved = 'Resolved',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Partial = 'Partial',
  Overdue = 'Overdue',
  Refunded = 'Refunded',
}
