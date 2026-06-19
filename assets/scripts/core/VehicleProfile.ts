export interface VehicleInfo {
    plateNumber: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    ownerName: string;
    ownerPhone: string;
}

export interface DiagnosisRecord {
    diagId: string;
    diagDescription: string;
    selectedQuoteId: string;
    isCorrect: boolean;
    timestamp: number;
    reworkRisk: number;
}

export interface EventRecord {
    eventId: string;
    eventType: string;
    resolutionId: string;
    cost: number;
    timePenalty: number;
    timestamp: number;
}

export class VehicleProfile {

    vehicleInfo: VehicleInfo | null = null;
    diagnosisRecords: DiagnosisRecord[] = [];
    eventRecords: EventRecord[] = [];
    inspectionPhotoPaths: Map<string, string[]> = new Map();
    totalCost: number = 0;
    totalTimePenalty: number = 0;
    reworkCount: number = 0;

    setVehicleInfo(info: VehicleInfo): void {
        this.vehicleInfo = info;
    }

    addDiagnosisRecord(record: DiagnosisRecord): void {
        this.diagnosisRecords.push(record);
        if (!record.isCorrect) {
            this.reworkCount++;
        }
    }

    addEventRecord(record: EventRecord): void {
        this.eventRecords.push(record);
        this.totalCost += record.cost;
        this.totalTimePenalty += record.timePenalty;
    }

    setInspectionPhotos(diagId: string, paths: string[]): void {
        this.inspectionPhotoPaths.set(diagId, paths);
    }

    getReworkRate(): number {
        if (this.diagnosisRecords.length === 0) return 0;
        return this.reworkCount / this.diagnosisRecords.length;
    }

    isComplete(): boolean {
        if (this.diagnosisRecords.length === 0) return false;
        return this.diagnosisRecords.every(
            record => this.inspectionPhotoPaths.has(record.diagId)
        );
    }

    serialize(): object {
        return {
            vehicleInfo: this.vehicleInfo,
            diagnosisRecords: this.diagnosisRecords,
            eventRecords: this.eventRecords,
            inspectionPhotoPaths: Array.from(this.inspectionPhotoPaths.entries()),
            totalCost: this.totalCost,
            totalTimePenalty: this.totalTimePenalty,
            reworkCount: this.reworkCount,
        };
    }

    static deserialize(data: Record<string, unknown>): VehicleProfile {
        const profile = new VehicleProfile();

        if (data.vehicleInfo) {
            profile.vehicleInfo = data.vehicleInfo as VehicleInfo;
        }
        if (Array.isArray(data.diagnosisRecords)) {
            profile.diagnosisRecords = data.diagnosisRecords as DiagnosisRecord[];
        }
        if (Array.isArray(data.eventRecords)) {
            profile.eventRecords = data.eventRecords as EventRecord[];
        }
        if (Array.isArray(data.inspectionPhotoPaths)) {
            profile.inspectionPhotoPaths = new Map(data.inspectionPhotoPaths as [string, string[]][]);
        }
        if (typeof data.totalCost === 'number') {
            profile.totalCost = data.totalCost;
        }
        if (typeof data.totalTimePenalty === 'number') {
            profile.totalTimePenalty = data.totalTimePenalty;
        }
        if (typeof data.reworkCount === 'number') {
            profile.reworkCount = data.reworkCount;
        }

        return profile;
    }
}
