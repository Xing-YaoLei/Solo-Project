export type {
    IWorker, IDispatchRule, IDispatchContext, IDispatchRuleResult,
    IDispatchRecommendation, ITimeLimitConfig, ITimePenalty
} from '../types/GameTypes';

export {
    createWorker, DEFAULT_TIME_LIMIT_CONFIG, TIME_PENALTIES,
    calculateOrderTimeLimit, checkTimePenalty
} from '../types/GameTypes';
