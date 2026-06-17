-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CAREGIVER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "care_level" TEXT NOT NULL DEFAULT 'LEVEL_3',
    "fall_risk_level" TEXT NOT NULL DEFAULT 'LOW',
    "room_number" TEXT NOT NULL,
    "allergies" TEXT[],
    "emergency_contact" TEXT,
    "emergency_phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "admission_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_reminders" (
    "id" TEXT NOT NULL,
    "elder_id" TEXT NOT NULL,
    "medication_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "shift" TEXT NOT NULL,
    "administered_by" TEXT,
    "administered_at" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fall_incidents" (
    "id" TEXT NOT NULL,
    "elder_id" TEXT NOT NULL,
    "reported_by" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL DEFAULT 'LOW',
    "incident_time" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fall_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_conclusions" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "conclusion" TEXT NOT NULL,
    "action_plan" TEXT NOT NULL,
    "follow_up_date" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_conclusions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_records" (
    "id" TEXT NOT NULL,
    "elder_id" TEXT NOT NULL,
    "visitor_name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "visit_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_check_ins" (
    "id" TEXT NOT NULL,
    "elder_id" TEXT NOT NULL,
    "activity_name" TEXT NOT NULL,
    "activity_date" TIMESTAMP(3) NOT NULL,
    "checked_in" BOOLEAN NOT NULL DEFAULT false,
    "check_in_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "elders_care_level_idx" ON "elders"("care_level");

-- CreateIndex
CREATE INDEX "elders_fall_risk_level_idx" ON "elders"("fall_risk_level");

-- CreateIndex
CREATE INDEX "medication_reminders_elder_id_shift_idx" ON "medication_reminders"("elder_id", "shift");

-- CreateIndex
CREATE INDEX "medication_reminders_scheduled_time_idx" ON "medication_reminders"("scheduled_time");

-- CreateIndex
CREATE INDEX "medication_reminders_status_idx" ON "medication_reminders"("status");

-- CreateIndex
CREATE INDEX "fall_incidents_elder_id_idx" ON "fall_incidents"("elder_id");

-- CreateIndex
CREATE INDEX "fall_incidents_risk_level_idx" ON "fall_incidents"("risk_level");

-- CreateIndex
CREATE UNIQUE INDEX "review_conclusions_incident_id_key" ON "review_conclusions"("incident_id");

-- CreateIndex
CREATE INDEX "visit_records_elder_id_idx" ON "visit_records"("elder_id");

-- CreateIndex
CREATE INDEX "activity_check_ins_elder_id_activity_date_idx" ON "activity_check_ins"("elder_id", "activity_date");

-- AddForeignKey
ALTER TABLE "medication_reminders" ADD CONSTRAINT "medication_reminders_elder_id_fkey" FOREIGN KEY ("elder_id") REFERENCES "elders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_reminders" ADD CONSTRAINT "medication_reminders_administered_by_fkey" FOREIGN KEY ("administered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fall_incidents" ADD CONSTRAINT "fall_incidents_elder_id_fkey" FOREIGN KEY ("elder_id") REFERENCES "elders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fall_incidents" ADD CONSTRAINT "fall_incidents_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "fall_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_conclusions" ADD CONSTRAINT "review_conclusions_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "fall_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_conclusions" ADD CONSTRAINT "review_conclusions_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_records" ADD CONSTRAINT "visit_records_elder_id_fkey" FOREIGN KEY ("elder_id") REFERENCES "elders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_check_ins" ADD CONSTRAINT "activity_check_ins_elder_id_fkey" FOREIGN KEY ("elder_id") REFERENCES "elders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
