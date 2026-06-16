export enum PharmacistRole {
    REVIEWER = 'reviewer',
    SALES = 'sales',
    REPLENISHMENT = 'replenishment'
}

export namespace PharmacistRole {
    export function getDisplayName(role: PharmacistRole): string {
        switch (role) {
            case PharmacistRole.REVIEWER: return '审方药师';
            case PharmacistRole.SALES: return '营业员';
            case PharmacistRole.REPLENISHMENT: return '补货专员';
            default: return '未知岗位';
        }
    }
}
