"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderChannel = exports.UserRole = exports.TimelineAction = exports.ResponsibilityParty = exports.RefundStatus = void 0;
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "PENDING";
    RefundStatus["ASSIGNED"] = "ASSIGNED";
    RefundStatus["PROCESSING"] = "PROCESSING";
    RefundStatus["EVIDENCE_UPLOADED"] = "EVIDENCE_UPLOADED";
    RefundStatus["REVIEWING"] = "REVIEWING";
    RefundStatus["APPROVED"] = "APPROVED";
    RefundStatus["REJECTED"] = "REJECTED";
    RefundStatus["RETRY"] = "RETRY";
    RefundStatus["SUPPLEMENT"] = "SUPPLEMENT";
    RefundStatus["CLOSED"] = "CLOSED";
    RefundStatus["TIMEOUT"] = "TIMEOUT";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
var ResponsibilityParty;
(function (ResponsibilityParty) {
    ResponsibilityParty["PLATFORM"] = "PLATFORM";
    ResponsibilityParty["MERCHANT"] = "MERCHANT";
    ResponsibilityParty["LOGISTICS"] = "LOGISTICS";
    ResponsibilityParty["CUSTOMER"] = "CUSTOMER";
    ResponsibilityParty["SUPPLIER"] = "SUPPLIER";
    ResponsibilityParty["OTHER"] = "OTHER";
})(ResponsibilityParty || (exports.ResponsibilityParty = ResponsibilityParty = {}));
var TimelineAction;
(function (TimelineAction) {
    TimelineAction["CREATED"] = "CREATED";
    TimelineAction["ASSIGNED"] = "ASSIGNED";
    TimelineAction["STATUS_CHANGED"] = "STATUS_CHANGED";
    TimelineAction["EVIDENCE_UPLOADED"] = "EVIDENCE_UPLOADED";
    TimelineAction["EVIDENCE_DELETED"] = "EVIDENCE_DELETED";
    TimelineAction["RETRY_REQUESTED"] = "RETRY_REQUESTED";
    TimelineAction["SUPPLEMENT_REQUESTED"] = "SUPPLEMENT_REQUESTED";
    TimelineAction["RESPONSIBILITY_ASSIGNED"] = "RESPONSIBILITY_ASSIGNED";
    TimelineAction["NOTE_ADDED"] = "NOTE_ADDED";
    TimelineAction["TIMEOUT_WARNING"] = "TIMEOUT_WARNING";
    TimelineAction["TIMEOUT"] = "TIMEOUT";
    TimelineAction["CLOSED"] = "CLOSED";
    TimelineAction["REOPENED"] = "REOPENED";
})(TimelineAction || (exports.TimelineAction = TimelineAction = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["OPERATOR"] = "OPERATOR";
    UserRole["VIEWER"] = "VIEWER";
})(UserRole || (exports.UserRole = UserRole = {}));
var ReminderChannel;
(function (ReminderChannel) {
    ReminderChannel["IN_APP"] = "IN_APP";
    ReminderChannel["EMAIL"] = "EMAIL";
    ReminderChannel["SMS"] = "SMS";
    ReminderChannel["WECHAT"] = "WECHAT";
})(ReminderChannel || (exports.ReminderChannel = ReminderChannel = {}));
//# sourceMappingURL=enums.js.map