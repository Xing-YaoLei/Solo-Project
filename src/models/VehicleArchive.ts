export interface VehicleBasicInfo {
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  vin: string;
  color: string;
  mileage: number;
  engineNumber: string;
  displacement: string;
  fuelType: '汽油' | '柴油' | '电动' | '混动';
}

export interface VehicleCondition {
  accidentHistory: boolean;
  accidentDescription?: string;
  waterDamage: boolean;
  fireDamage: boolean;
  modificationStatus: string;
  tireWear: '正常' | '偏磨' | '需更换';
  brakeStatus: '良好' | '正常' | '需检查';
  overallAssessment: '优秀' | '良好' | '一般' | '较差';
}

export interface OwnershipInfo {
  ownerName: string;
  ownerIdType: '身份证' | '护照' | '营业执照';
  ownerIdNumber: string;
  ownershipTransferCount: number;
  registrationDate: string;
  currentMileage: number;
  annualInspectionValid: boolean;
  annualInspectionExpiryDate?: string;
}

export interface VehicleArchive {
  id: string;
  basicInfo: VehicleBasicInfo;
  condition: VehicleCondition;
  ownership: OwnershipInfo;
  hasEncumbrance: boolean;
  encumbranceDescription?: string;
  isSeized: boolean;
  notes?: string;
}
