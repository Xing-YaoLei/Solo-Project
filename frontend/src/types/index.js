export const ExceptionTypeEnum = {
    PERFORMANCE_CANCEL: 'performance_cancel',
    ROUTE_CHANGE: 'route_change',
    EQUIPMENT_FAILURE: 'equipment_failure',
    WEATHER_ISSUE: 'weather_issue',
    STAFF_ABSENCE: 'staff_absence',
    OTHER: 'other',
};
export const ROLE_LABELS = {
    tourist: '游客',
    ticket_clerk: '票务员',
    patrol: '巡场员',
    operation: '运营',
    admin: '管理员',
};
export const STATUS_LABELS = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
    completed: '已完成',
};
export const STATUS_COLORS = {
    draft: 'default',
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default',
    completed: 'processing',
};
export const EXCEPTION_LABELS = {
    performance_cancel: '演出取消',
    route_change: '路线变更',
    equipment_failure: '设备故障',
    weather_issue: '天气问题',
    staff_absence: '人员缺岗',
    other: '其他',
};
