export enum ChannelType {
    DIRECT = "direct",
    OTA_A = "ota_a",
    OTA_B = "ota_b",
    OTA_C = "ota_c",
    WALK_IN = "walk_in",
    PHONE = "phone"
}

export interface Channel {
    type: ChannelType;
    name: string;
    color: string;
    icon: string;
    commissionRate: number;
    orderWeight: number;
    cancelProbability: number;
    avgLeadTime: number;
}
