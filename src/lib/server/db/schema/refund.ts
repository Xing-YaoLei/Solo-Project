import { pgTable, text, timestamp, integer, json, boolean, uuid } from 'drizzle-orm/pg-core';
import { userTable } from './auth';

export const refundOrderTable = pgTable('refund_order', {
	id: uuid('id').primaryKey().defaultRandom(),
	orderNo: text('order_no').notNull().unique(),
	communityName: text('community_name').notNull(),
	region: text('region').notNull(),
	customerName: text('customer_name').notNull(),
	customerPhone: text('customer_phone').notNull(),
	productName: text('product_name').notNull(),
	refundAmount: integer('refund_amount').notNull(),
	refundReason: text('refund_reason').notNull(),
	status: text('status').notNull().default('pending'),
	responsibility: text('responsibility'),
	issueTag: text('issue_tag'),
	currentHandlerId: text('current_handler_id').references(() => userTable.id),
	currentHandlerName: text('current_handler_name'),
	followupResult: text('followup_result'),
	closedAt: timestamp('closed_at'),
	dueAt: timestamp('due_at'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const refundLogTable = pgTable('refund_log', {
	id: uuid('id').primaryKey().defaultRandom(),
	refundOrderId: uuid('refund_order_id').notNull().references(() => refundOrderTable.id),
	actionType: text('action_type').notNull(),
	actionDetail: text('action_detail'),
	oldStatus: text('old_status'),
	newStatus: text('new_status'),
	oldHandlerId: text('old_handler_id'),
	newHandlerId: text('new_handler_id'),
	operatorId: text('operator_id').references(() => userTable.id),
	operatorName: text('operator_name'),
	remark: text('remark'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});
