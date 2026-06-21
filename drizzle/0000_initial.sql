CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(32) DEFAULT 'worker' NOT NULL,
	"full_name" varchar(128) NOT NULL,
	"phone" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);

CREATE TABLE IF NOT EXISTS "session" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_no" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"address" varchar(500),
	"customer_name" varchar(128) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"project_manager" uuid,
	"status" varchar(32) DEFAULT 'ongoing' NOT NULL,
	"start_date" timestamp with time zone,
	"expected_end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_project_no_unique" UNIQUE("project_no")
);

CREATE TABLE IF NOT EXISTS "authorization_scope" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"scope_type" varchar(64) NOT NULL,
	"description" text,
	"authorized_by" uuid,
	"authorized_at" timestamp with time zone,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "customer_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"id_card_no" varchar(32),
	"address" varchar(500),
	"email" varchar(128),
	"emergency_contact" varchar(128),
	"emergency_phone" varchar(20),
	"house_area" integer,
	"house_type" varchar(64),
	"decoration_style" varchar(64),
	"budget" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profile_project_id_unique" UNIQUE("project_id")
);

CREATE TABLE IF NOT EXISTS "change_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"change_type" varchar(64) NOT NULL,
	"change_content" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"reason" text,
	"created_by" uuid NOT NULL,
	"review_status" varchar(32) DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"review_comment" text,
	"customer_confirmed" boolean DEFAULT false NOT NULL,
	"customer_confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "document_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"code" varchar(32) NOT NULL,
	"description" text,
	"required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_category_code_unique" UNIQUE("code")
);

CREATE TABLE IF NOT EXISTS "attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"category_id" uuid,
	"change_record_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"file_size" integer,
	"file_type" varchar(64),
	"uploaded_by" uuid NOT NULL,
	"description" text,
	"version" varchar(32) DEFAULT '1.0',
	"is_valid" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "review_opinion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" uuid NOT NULL,
	"content" text NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'comment' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "communication_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"review_opinion_id" uuid,
	"content" text NOT NULL,
	"communicator_id" uuid NOT NULL,
	"communication_type" varchar(32) DEFAULT 'internal' NOT NULL,
	"customer_involved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "document_completeness_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"completeness_rate" integer NOT NULL,
	"total_required" integer NOT NULL,
	"completed_count" integer NOT NULL,
	"missing_categories" jsonb,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "project" ADD CONSTRAINT "project_project_manager_user_id_fk" FOREIGN KEY ("project_manager") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "authorization_scope" ADD CONSTRAINT "authorization_scope_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "authorization_scope" ADD CONSTRAINT "authorization_scope_authorized_by_user_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "customer_profile" ADD CONSTRAINT "customer_profile_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "change_record" ADD CONSTRAINT "change_record_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "change_record" ADD CONSTRAINT "change_record_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "change_record" ADD CONSTRAINT "change_record_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "attachment" ADD CONSTRAINT "attachment_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "attachment" ADD CONSTRAINT "attachment_category_id_document_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "document_category"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "attachment" ADD CONSTRAINT "attachment_change_record_id_change_record_id_fk" FOREIGN KEY ("change_record_id") REFERENCES "change_record"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "attachment" ADD CONSTRAINT "attachment_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "review_opinion" ADD CONSTRAINT "review_opinion_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "review_opinion" ADD CONSTRAINT "review_opinion_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "communication_note" ADD CONSTRAINT "communication_note_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "communication_note" ADD CONSTRAINT "communication_note_review_opinion_id_review_opinion_id_fk" FOREIGN KEY ("review_opinion_id") REFERENCES "review_opinion"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "communication_note" ADD CONSTRAINT "communication_note_communicator_id_user_id_fk" FOREIGN KEY ("communicator_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "document_completeness_log" ADD CONSTRAINT "document_completeness_log_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

INSERT INTO "document_category" ("name", "code", "description", "required", "sort_order") VALUES
('装修合同', 'contract', '正式装修合同及补充协议', true, 1),
('客户身份证', 'id_card', '客户身份证复印件', true, 2),
('付款凭证', 'payment_proof', '各期款项支付凭证', true, 3),
('验收单据', 'acceptance', '各阶段验收确认单据', true, 4),
('设计图纸', 'design_draw', '全套施工设计图纸', true, 5),
('材料清单', 'material_list', '主要材料品牌规格清单', true, 6),
('施工照片', 'construction_photo', '各关键节点施工照片', true, 7),
('授权委托书', 'authorization', '如有委托需提供授权书', false, 8),
('房屋证明', 'house_proof', '房产证或购房合同', false, 9),
('其他资料', 'other', '其他相关资料', false, 10);
