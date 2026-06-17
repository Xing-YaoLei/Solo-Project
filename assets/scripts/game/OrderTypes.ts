export type {
    OrderType, OrderPriority, OrderStatus, RepairCategory, LocationType,
    IOrderLocation, IOrderReward, IOrderPenalty, IChoiceResult, IChoice,
    IClue, IOrderStage, IOrderContext, IRepairOrder, IActiveOrder
} from '../types/GameTypes';

export {
    getOrderByPriority, getPriorityColor, getStatusText, getCategoryText,
    createActiveOrder
} from '../types/GameTypes';
