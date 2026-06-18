export interface FinanceInfo {
  hasLoan: boolean;
  loanOutstandingBalance?: number;
  loanBank?: string;
  loanStartDate?: string;
  loanTermMonths?: number;
  loanMonthlyPayment?: number;
  loanPaidOff: boolean;
  releaseOfMortgageAvailable: boolean;
}

export interface InsuranceInfo {
  hasInsurance: boolean;
  insuranceType?: '交强险' | '商业险' | '全险';
  insuranceCompany?: string;
  policyNumber?: string;
  policyStartDate?: string;
  policyEndDate?: string;
  coverageAmount?: number;
  claimHistory: {
    date: string;
    amount: number;
    description: string;
  }[];
}

export interface TaxInfo {
  vehiclePurchaseTaxPaid: boolean;
  vehiclePurchaseTaxAmount?: number;
  annualVehicleTaxPaid: boolean;
  annualVehicleTaxAmount?: number;
  taxArrears: boolean;
  taxArrearsAmount?: number;
}

export interface FinanceDocuments {
  id: string;
  finance: FinanceInfo;
  insurance: InsuranceInfo;
  tax: TaxInfo;
  paymentMethod: '全款' | '贷款' | '置换' | '混合';
  downPaymentAmount?: number;
  financingApprovalStatus: '未申请' | '审批中' | '已通过' | '已拒绝';
  specialNotes?: string;
}
