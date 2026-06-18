export enum MaterialType {
  VEHICLE_REGISTRATION_CERTIFICATE = 'vehicle_registration_certificate',
  ID_CARD_OWNER = 'id_card_owner',
  ID_CARD_BUYER = 'id_card_buyer',
  PURCHASE_CONTRACT = 'purchase_contract',
  INVOICE = 'invoice',
  INSURANCE_POLICY = 'insurance_policy',
  MAINTENANCE_RECORDS = 'maintenance_records',
  EMISSION_TEST = 'emission_test',
  LOAN_AGREEMENT = 'loan_agreement',
  TRANSFER_APPLICATION = 'transfer_application',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  VEHICLE_PHOTOS = 'vehicle_photos'
}

export const MaterialTypeNames: Record<MaterialType, string> = {
  [MaterialType.VEHICLE_REGISTRATION_CERTIFICATE]: '机动车登记证书',
  [MaterialType.ID_CARD_OWNER]: '车主身份证',
  [MaterialType.ID_CARD_BUYER]: '买方身份证',
  [MaterialType.PURCHASE_CONTRACT]: '购车合同',
  [MaterialType.INVOICE]: '购车发票',
  [MaterialType.INSURANCE_POLICY]: '保险单',
  [MaterialType.MAINTENANCE_RECORDS]: '维修保养记录',
  [MaterialType.EMISSION_TEST]: '尾气检测报告',
  [MaterialType.LOAN_AGREEMENT]: '贷款协议',
  [MaterialType.TRANSFER_APPLICATION]: '过户申请表',
  [MaterialType.POWER_OF_ATTORNEY]: '授权委托书',
  [MaterialType.VEHICLE_PHOTOS]: '车辆照片'
};

export interface Material {
  id: string;
  type: MaterialType;
  name: string;
  isPresent: boolean;
  isValid: boolean;
  issueDescription?: string;
  missingFields?: string[];
}
