# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_16_090636) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "areas", force: :cascade do |t|
    t.string "code"
    t.datetime "created_at", null: false
    t.string "name"
    t.datetime "updated_at", null: false
  end

  create_table "assessment_records", force: :cascade do |t|
    t.date "assessed_at"
    t.bigint "assessor_id", null: false
    t.datetime "created_at", null: false
    t.string "grade"
    t.jsonb "item_scores"
    t.bigint "patient_id", null: false
    t.bigint "scale_id", null: false
    t.string "status", default: "draft"
    t.decimal "total_score"
    t.datetime "updated_at", null: false
    t.index ["assessed_at"], name: "idx_assessment_records_assessed_at"
    t.index ["assessor_id"], name: "idx_assessment_records_assessor"
    t.index ["assessor_id"], name: "index_assessment_records_on_assessor_id"
    t.index ["patient_id"], name: "idx_assessment_records_patient"
    t.index ["patient_id"], name: "index_assessment_records_on_patient_id"
    t.index ["scale_id"], name: "index_assessment_records_on_scale_id"
    t.index ["status"], name: "idx_assessment_records_status"
  end

  create_table "assessment_scales", force: :cascade do |t|
    t.boolean "active", default: true
    t.string "category"
    t.datetime "created_at", null: false
    t.string "name"
    t.jsonb "scoring_config"
    t.datetime "updated_at", null: false
    t.string "version", default: "1.0"
  end

  create_table "denial_actions", force: :cascade do |t|
    t.string "action_type"
    t.datetime "created_at", null: false
    t.jsonb "materials", default: []
    t.bigint "operator_id", null: false
    t.datetime "performed_at"
    t.text "reason"
    t.bigint "settlement_id", null: false
    t.datetime "updated_at", null: false
    t.index ["operator_id"], name: "index_denial_actions_on_operator_id"
    t.index ["settlement_id"], name: "idx_denial_actions_settlement"
    t.index ["settlement_id"], name: "index_denial_actions_on_settlement_id"
  end

  create_table "equipment", force: :cascade do |t|
    t.bigint "area_id", null: false
    t.string "category"
    t.string "code"
    t.datetime "created_at", null: false
    t.date "last_maintenance_date"
    t.string "name"
    t.string "status", default: "normal"
    t.datetime "updated_at", null: false
    t.index ["area_id"], name: "idx_equipment_area"
    t.index ["area_id"], name: "index_equipment_on_area_id"
    t.index ["status"], name: "idx_equipment_status"
  end

  create_table "equipment_maintenances", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "equipment_id", null: false
    t.string "maintenance_type"
    t.date "performed_at"
    t.bigint "performer_id", null: false
    t.datetime "updated_at", null: false
    t.index ["equipment_id"], name: "index_equipment_maintenances_on_equipment_id"
    t.index ["performer_id"], name: "index_equipment_maintenances_on_performer_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.text "message"
    t.boolean "read", default: false
    t.datetime "sent_at"
    t.bigint "settlement_id"
    t.string "title"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["read"], name: "idx_notifications_read"
    t.index ["settlement_id"], name: "index_notifications_on_settlement_id"
    t.index ["user_id"], name: "idx_notifications_user"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "nursing_logs", force: :cascade do |t|
    t.bigint "assessment_record_id"
    t.string "care_type"
    t.text "content"
    t.datetime "created_at", null: false
    t.date "logged_at"
    t.bigint "nurse_id", null: false
    t.bigint "patient_id", null: false
    t.datetime "updated_at", null: false
    t.index ["assessment_record_id"], name: "index_nursing_logs_on_assessment_record_id"
    t.index ["logged_at"], name: "idx_nursing_logs_date"
    t.index ["nurse_id"], name: "index_nursing_logs_on_nurse_id"
    t.index ["patient_id"], name: "idx_nursing_logs_patient"
    t.index ["patient_id"], name: "index_nursing_logs_on_patient_id"
  end

  create_table "patients", force: :cascade do |t|
    t.bigint "area_id", null: false
    t.date "birth_date"
    t.datetime "created_at", null: false
    t.string "medical_record_no"
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["area_id"], name: "index_patients_on_area_id"
  end

  create_table "prescription_rules", force: :cascade do |t|
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.string "name"
    t.jsonb "training_plan"
    t.text "trigger_condition"
    t.datetime "updated_at", null: false
  end

  create_table "scale_items", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.string "name"
    t.bigint "scale_id", null: false
    t.jsonb "scoring_rule"
    t.integer "sort_order", default: 0
    t.datetime "updated_at", null: false
    t.decimal "weight", default: "1.0"
    t.index ["scale_id"], name: "idx_scale_items_scale"
    t.index ["scale_id"], name: "index_scale_items_on_scale_id"
  end

  create_table "settlements", force: :cascade do |t|
    t.decimal "amount", default: "0.0"
    t.bigint "assessment_record_id", null: false
    t.datetime "created_at", null: false
    t.string "insurance_type"
    t.bigint "patient_id", null: false
    t.date "settled_at"
    t.string "status", default: "pending"
    t.date "submitted_at"
    t.datetime "updated_at", null: false
    t.index ["assessment_record_id"], name: "index_settlements_on_assessment_record_id"
    t.index ["patient_id"], name: "idx_settlements_patient"
    t.index ["patient_id"], name: "index_settlements_on_patient_id"
    t.index ["status"], name: "idx_settlements_status"
  end

  create_table "training_prescriptions", force: :cascade do |t|
    t.bigint "assessment_record_id", null: false
    t.datetime "created_at", null: false
    t.date "end_date"
    t.jsonb "plan_detail"
    t.bigint "rule_id", null: false
    t.date "start_date"
    t.string "status", default: "pending"
    t.bigint "therapist_id", null: false
    t.datetime "updated_at", null: false
    t.index ["assessment_record_id"], name: "index_training_prescriptions_on_assessment_record_id"
    t.index ["rule_id"], name: "index_training_prescriptions_on_rule_id"
    t.index ["status"], name: "idx_training_prescriptions_status"
    t.index ["therapist_id"], name: "index_training_prescriptions_on_therapist_id"
  end

  create_table "training_sessions", force: :cascade do |t|
    t.integer "actual_duration", default: 0
    t.datetime "created_at", null: false
    t.bigint "equipment_id", null: false
    t.integer "planned_duration", default: 0
    t.bigint "prescription_id", null: false
    t.date "session_date"
    t.string "status", default: "planned"
    t.datetime "updated_at", null: false
    t.index ["equipment_id"], name: "index_training_sessions_on_equipment_id"
    t.index ["prescription_id"], name: "idx_training_sessions_prescription"
    t.index ["prescription_id"], name: "index_training_sessions_on_prescription_id"
    t.index ["session_date"], name: "idx_training_sessions_date"
    t.index ["status"], name: "idx_training_sessions_status"
  end

  create_table "treatment_calendar_thresholds", force: :cascade do |t|
    t.bigint "area_id", null: false
    t.datetime "created_at", null: false
    t.integer "max_daily_treatments", default: 20
    t.integer "min_interval_minutes", default: 30
    t.jsonb "time_slots"
    t.datetime "updated_at", null: false
    t.index ["area_id"], name: "index_treatment_calendar_thresholds_on_area_id"
  end

  create_table "users", force: :cascade do |t|
    t.bigint "area_id", null: false
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "role", default: "therapist"
    t.datetime "updated_at", null: false
    t.index ["area_id"], name: "index_users_on_area_id"
  end

  add_foreign_key "assessment_records", "assessment_scales", column: "scale_id"
  add_foreign_key "assessment_records", "patients"
  add_foreign_key "assessment_records", "users", column: "assessor_id"
  add_foreign_key "denial_actions", "settlements"
  add_foreign_key "denial_actions", "users", column: "operator_id"
  add_foreign_key "equipment", "areas"
  add_foreign_key "equipment_maintenances", "equipment"
  add_foreign_key "equipment_maintenances", "users", column: "performer_id"
  add_foreign_key "notifications", "settlements"
  add_foreign_key "notifications", "users"
  add_foreign_key "nursing_logs", "assessment_records"
  add_foreign_key "nursing_logs", "patients"
  add_foreign_key "nursing_logs", "users", column: "nurse_id"
  add_foreign_key "patients", "areas"
  add_foreign_key "scale_items", "assessment_scales", column: "scale_id"
  add_foreign_key "settlements", "assessment_records"
  add_foreign_key "settlements", "patients"
  add_foreign_key "training_prescriptions", "assessment_records"
  add_foreign_key "training_prescriptions", "prescription_rules", column: "rule_id"
  add_foreign_key "training_prescriptions", "users", column: "therapist_id"
  add_foreign_key "training_sessions", "equipment"
  add_foreign_key "training_sessions", "training_prescriptions", column: "prescription_id"
  add_foreign_key "treatment_calendar_thresholds", "areas"
  add_foreign_key "users", "areas"
end
