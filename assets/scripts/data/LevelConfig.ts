import { PharmacistRole } from './enums/PharmacistRole';
import { Difficulty } from './enums/Difficulty';
import { TaskAction } from './enums/TaskAction';

export interface BlurConfig {
    enabled: boolean;
    blurRadius: number;
    obscureAreas: string[];
    tiltAngle: number;
    randomSeed: number;
}

export interface PrescriptionData {
    patientName: string;
    patientAge: number;
    patientGender: string;
    drugName: string;
    drugSpecification: string;
    dosage: number;
    frequency: string;
    duration: string;
    diagnosis: string;
    doctorName: string;
    isExpired: boolean;
    hasDoctorSignature: boolean;
    hasHospitalStamp: boolean;
    issueDate: string;
    blurLevel: number;
}

export interface ReplenishmentData {
    orderId: string;
    drugName: string;
    requestedQuantity: number;
    currentStock: number;
    unitPrice: number;
    supplier: string;
    expiryDate: string;
    isUrgent: boolean;
}

export interface InsuranceData {
    recordId: string;
    patientName: string;
    idCardNumber: string;
    insuranceType: string;
    drugName: string;
    totalAmount: number;
    insuranceCoverage: number;
    personalPayment: number;
    transactionDate: string;
    isReimbursable: boolean;
    reimbursementLimit: number;
}

export interface AdviceConfig {
    id: string;
    condition: string;
    content: string;
    type: 'hint' | 'warning' | 'info';
    priority: number;
}

export interface WrongActionConfig {
    action: TaskAction;
    reason: string;
    penalty: number;
    knowledgeExplanation: string;
}

export interface TaskConfig {
    id: string;
    description: string;
    prescription: PrescriptionData;
    replenishmentOrder: ReplenishmentData;
    insuranceRecord: InsuranceData;
    correctAction: TaskAction;
    wrongActions: WrongActionConfig[];
    score: number;
    knowledgePoint: string;
}

export interface LevelConfig {
    id: string;
    name: string;
    description: string;
    roles: PharmacistRole[];
    difficulty: Difficulty;
    timeLimit: number;
    passingScore: number;
    tasks: TaskConfig[];
    pharmacistAdvice: AdviceConfig[];
    prescriptionBlur?: BlurConfig;
}
