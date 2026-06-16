export enum TaskAction {
    APPROVE = 'approve',
    REJECT = 'reject',
    SUPPLEMENT = 'supplement',
    REPORT = 'report'
}

export namespace TaskAction {
    export function getDisplayName(action: TaskAction): string {
        switch (action) {
            case TaskAction.APPROVE: return '通过';
            case TaskAction.REJECT: return '拒绝';
            case TaskAction.SUPPLEMENT: return '需补充材料';
            case TaskAction.REPORT: return '上报';
            default: return '未知操作';
        }
    }

    export function getColor(action: TaskAction): string {
        switch (action) {
            case TaskAction.APPROVE: return '#4CAF50';
            case TaskAction.REJECT: return '#F44336';
            case TaskAction.SUPPLEMENT: return '#FF9800';
            case TaskAction.REPORT: return '#2196F3';
            default: return '#999999';
        }
    }
}
