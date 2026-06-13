export interface CapacityRuleData {
    id: string;
    name: string;
    description: string;
    rules: CapacityRuleItem[];
}

export interface CapacityRuleItem {
    type: string;
    [key: string]: any;
}

export class CapacityRule {
    id: string = "";
    name: string = "";
    description: string = "";
    maxConcurrentPerStation: number = 1;
    allowOverbook: boolean = false;
    overbookLimit: number = 0;
    overbookCondition: string = "";
    defaultDurationMinutes: number = 60;
    shortServiceMinutes: number = 30;
    longServiceMinutes: number = 120;
    bufferMinutes: number = 5;
    lateThresholdMinutes: number = 15;
    noShowThresholdMinutes: number = 30;
    earlyThresholdMinutes: number = 0;
    cancelThresholdMinutes: number = 0;
    maxStationsPerTechnician: number = 1;
    sharedServiceIds: string[] = [];
    shortServiceIds: string[] = [];
    maxShortPerStation: number = 1;
    allowSlotAdjust: boolean = false;
    maxAdjustMinutes: number = 0;
    maxWaitlistSize: number = 0;
    autoPromoteOnCancel: boolean = false;

    static fromData(data: CapacityRuleData): CapacityRule {
        const rule = new CapacityRule();
        rule.id = data.id;
        rule.name = data.name;
        rule.description = data.description;
        for (const item of data.rules) {
            switch (item.type) {
                case "station_capacity":
                    rule.maxConcurrentPerStation = item.maxConcurrentPerStation ?? 1;
                    rule.allowOverbook = item.allowOverbook ?? false;
                    rule.overbookLimit = item.overbookLimit ?? 0;
                    rule.overbookCondition = item.overbookCondition ?? "";
                    break;
                case "service_duration":
                    rule.defaultDurationMinutes = item.defaultMinutes ?? 60;
                    rule.shortServiceMinutes = item.shortServiceMinutes ?? 30;
                    rule.longServiceMinutes = item.longServiceMinutes ?? 120;
                    rule.bufferMinutes = item.bufferMinutes ?? 5;
                    break;
                case "arrival_window":
                    rule.lateThresholdMinutes = item.lateThresholdMinutes ?? 15;
                    rule.noShowThresholdMinutes = item.noShowThresholdMinutes ?? 30;
                    rule.earlyThresholdMinutes = item.earlyThresholdMinutes ?? 0;
                    rule.cancelThresholdMinutes = item.cancelThresholdMinutes ?? 0;
                    break;
                case "technician_sharing":
                    rule.maxStationsPerTechnician = item.maxStationsPerTechnician ?? 1;
                    rule.sharedServiceIds = item.sharedServiceIds ?? [];
                    break;
                case "short_service_concurrent":
                    rule.maxShortPerStation = item.maxShortPerStation ?? 1;
                    rule.shortServiceIds = item.shortServiceIds ?? [];
                    break;
                case "flexible_slot":
                    rule.allowSlotAdjust = item.allowSlotAdjust ?? false;
                    rule.maxAdjustMinutes = item.maxAdjustMinutes ?? 0;
                    break;
                case "waitlist":
                    rule.maxWaitlistSize = item.maxWaitlistSize ?? 0;
                    rule.autoPromoteOnCancel = item.autoPromoteOnCancel ?? false;
                    break;
            }
        }
        return rule;
    }

    getServiceDuration(serviceId: string): number {
        if (this.shortServiceIds.includes(serviceId)) {
            return this.shortServiceMinutes;
        }
        return this.defaultDurationMinutes;
    }

    isSharedService(serviceId: string): boolean {
        return this.sharedServiceIds.includes(serviceId);
    }

    canOverbook(): boolean {
        return this.allowOverbook;
    }
}
