export enum GameMode {
    FORMAL_TRAINING = 'formal_training',
    FREE_PRACTICE = 'free_practice',
    CHALLENGE = 'challenge'
}

export enum PostType {
    TICKET_CHECKER = 'ticket_checker',
    RESERVATION_CLERK = 'reservation_clerk',
    SITE_MANAGER = 'site_manager'
}

export enum ReservationStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    RESCHEDULED = 'rescheduled',
    CANCELLED = 'cancelled',
    ARRIVED = 'arrived',
    NO_SHOW = 'no_show'
}

export enum ArrivalStatus {
    NOT_ARRIVED = 'not_arrived',
    ARRIVED_ON_TIME = 'arrived_on_time',
    ARRIVED_LATE = 'arrived_late',
    ARRIVED_EARLY = 'arrived_early'
}

export enum ConflictType {
    NONE = 'none',
    TIME_SLOT_OVERLAP = 'time_slot_overlap',
    CAPACITY_EXCEEDED = 'capacity_exceeded',
    SAME_PERSON_MULTI_BOOKING = 'same_person_multi_booking',
    BLACKLIST = 'blacklist',
    INVALID_TIME = 'invalid_time'
}

export enum ActionType {
    APPROVE_RESERVATION = 'approve_reservation',
    REJECT_RESERVATION = 'reject_reservation',
    RESCHEDULE = 'reschedule',
    CHECK_IN = 'check_in',
    DENY_ENTRY = 'deny_entry',
    ESCALATE = 'escalate'
}

export enum DifficultyLevel {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    EXTREME = 'extreme'
}
