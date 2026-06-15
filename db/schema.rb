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

ActiveRecord::Schema[7.2].define(version: 2026_06_01_000015) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "assignment_submissions", force: :cascade do |t|
    t.bigint "assignment_id", null: false
    t.bigint "student_id", null: false
    t.bigint "reviewer_id"
    t.text "content"
    t.string "attachment_url"
    t.datetime "submitted_at"
    t.datetime "last_modified_at"
    t.string "status", default: "draft"
    t.decimal "score", precision: 5, scale: 2
    t.float "plagiarism_score"
    t.boolean "plagiarism_flagged", default: false
    t.jsonb "plagiarism_details", default: {}
    t.text "feedback"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["assignment_id"], name: "index_assignment_submissions_on_assignment_id"
    t.index ["plagiarism_flagged"], name: "index_assignment_submissions_on_plagiarism_flagged"
    t.index ["reviewer_id"], name: "index_assignment_submissions_on_reviewer_id"
    t.index ["student_id", "assignment_id"], name: "index_assignment_submissions_on_student_id_and_assignment_id", unique: true
    t.index ["student_id"], name: "index_assignment_submissions_on_student_id"
  end

  create_table "assignments", force: :cascade do |t|
    t.string "title", null: false
    t.bigint "community_id"
    t.bigint "creator_id"
    t.text "description"
    t.date "due_date"
    t.decimal "total_score", precision: 5, scale: 2
    t.boolean "enable_plagiarism_check", default: true
    t.float "plagiarism_threshold", default: 30.0
    t.text "requirements"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["community_id"], name: "index_assignments_on_community_id"
    t.index ["creator_id"], name: "index_assignments_on_creator_id"
  end

  create_table "benefit_rules", force: :cascade do |t|
    t.string "name", null: false
    t.string "rule_type"
    t.string "target_member_level"
    t.jsonb "conditions", default: {}
    t.jsonb "benefits", default: {}
    t.boolean "is_active", default: true
    t.date "effective_date"
    t.date "expiry_date"
    t.bigint "creator_id"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_benefit_rules_on_creator_id"
  end

  create_table "communities", force: :cascade do |t|
    t.string "name", null: false
    t.string "course_name"
    t.text "description"
    t.string "status", default: "active"
    t.bigint "manager_id"
    t.date "start_date"
    t.date "end_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["manager_id"], name: "index_communities_on_manager_id"
  end

  create_table "exam_results", force: :cascade do |t|
    t.bigint "exam_id", null: false
    t.bigint "student_id", null: false
    t.decimal "score", precision: 5, scale: 2
    t.boolean "passed", default: false
    t.integer "rank"
    t.text "answer_sheet_url"
    t.bigint "reviewer_id"
    t.datetime "reviewed_at"
    t.text "remarks"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["exam_id", "student_id"], name: "index_exam_results_on_exam_id_and_student_id", unique: true
    t.index ["exam_id"], name: "index_exam_results_on_exam_id"
    t.index ["passed"], name: "index_exam_results_on_passed"
    t.index ["reviewer_id"], name: "index_exam_results_on_reviewer_id"
    t.index ["student_id"], name: "index_exam_results_on_student_id"
  end

  create_table "exams", force: :cascade do |t|
    t.string "name", null: false
    t.string "exam_type"
    t.bigint "community_id"
    t.date "exam_date"
    t.integer "duration_minutes"
    t.decimal "passing_score", precision: 5, scale: 2
    t.decimal "total_score", precision: 5, scale: 2
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["community_id"], name: "index_exams_on_community_id"
  end

  create_table "export_records", force: :cascade do |t|
    t.bigint "operator_id"
    t.string "export_type", null: false
    t.jsonb "filter_conditions", default: {}
    t.string "file_url"
    t.string "file_name"
    t.string "status", default: "processing"
    t.datetime "generated_at"
    t.text "error_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["export_type"], name: "index_export_records_on_export_type"
    t.index ["operator_id"], name: "index_export_records_on_operator_id"
    t.index ["status"], name: "index_export_records_on_status"
  end

  create_table "member_profiles", force: :cascade do |t|
    t.bigint "student_id", null: false
    t.string "member_level", default: "basic"
    t.date "membership_start_date"
    t.date "membership_end_date"
    t.integer "total_points", default: 0
    t.integer "available_points", default: 0
    t.string "payment_status", default: "unpaid"
    t.decimal "total_amount", precision: 10, scale: 2, default: "0.0"
    t.text "benefits_overview"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["student_id"], name: "index_member_profiles_on_student_id"
  end

  create_table "operation_logs", force: :cascade do |t|
    t.bigint "operator_id"
    t.string "action", null: false
    t.string "target_type"
    t.bigint "target_id"
    t.text "reason"
    t.text "details"
    t.jsonb "before_data", default: {}
    t.jsonb "after_data", default: {}
    t.string "ip_address"
    t.string "user_agent"
    t.string "status", default: "completed"
    t.datetime "closed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_operation_logs_on_action"
    t.index ["created_at"], name: "index_operation_logs_on_created_at"
    t.index ["operator_id"], name: "index_operation_logs_on_operator_id"
    t.index ["target_type", "target_id"], name: "index_operation_logs_on_target_type_and_target_id"
  end

  create_table "plagiarism_logs", force: :cascade do |t|
    t.bigint "assignment_submission_id", null: false
    t.bigint "student_id", null: false
    t.bigint "assignment_id"
    t.bigint "source_submission_id"
    t.float "similarity_score"
    t.text "reason"
    t.jsonb "similar_segments", default: {}
    t.string "status", default: "open"
    t.bigint "responsible_user_id"
    t.datetime "notified_at"
    t.datetime "resolved_at"
    t.datetime "closed_at"
    t.string "action_taken"
    t.text "resolution_notes"
    t.bigint "handler_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["assignment_id"], name: "index_plagiarism_logs_on_assignment_id"
    t.index ["assignment_submission_id"], name: "index_plagiarism_logs_on_assignment_submission_id"
    t.index ["handler_id"], name: "index_plagiarism_logs_on_handler_id"
    t.index ["responsible_user_id"], name: "index_plagiarism_logs_on_responsible_user_id"
    t.index ["source_submission_id"], name: "index_plagiarism_logs_on_source_submission_id"
    t.index ["status"], name: "index_plagiarism_logs_on_status"
    t.index ["student_id"], name: "index_plagiarism_logs_on_student_id"
  end

  create_table "redemption_records", force: :cascade do |t|
    t.bigint "student_id", null: false
    t.bigint "benefit_rule_id"
    t.bigint "operator_id"
    t.string "benefit_name"
    t.string "redemption_code"
    t.datetime "redeemed_at"
    t.string "channel"
    t.string "status", default: "pending"
    t.integer "points_used", default: 0
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["benefit_rule_id"], name: "index_redemption_records_on_benefit_rule_id"
    t.index ["operator_id"], name: "index_redemption_records_on_operator_id"
    t.index ["redeemed_at"], name: "index_redemption_records_on_redeemed_at"
    t.index ["status"], name: "index_redemption_records_on_status"
    t.index ["student_id"], name: "index_redemption_records_on_student_id"
  end

  create_table "refund_records", force: :cascade do |t|
    t.bigint "student_id", null: false
    t.bigint "member_profile_id"
    t.bigint "operator_id"
    t.decimal "refund_amount", precision: 10, scale: 2
    t.string "refund_reason_code"
    t.text "refund_reason"
    t.string "refund_status", default: "pending"
    t.string "payment_method"
    t.datetime "refunded_at"
    t.text "approval_notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["member_profile_id"], name: "index_refund_records_on_member_profile_id"
    t.index ["operator_id"], name: "index_refund_records_on_operator_id"
    t.index ["refund_reason_code"], name: "index_refund_records_on_refund_reason_code"
    t.index ["refund_status"], name: "index_refund_records_on_refund_status"
    t.index ["student_id"], name: "index_refund_records_on_student_id"
  end

  create_table "students", force: :cascade do |t|
    t.string "name", null: false
    t.string "phone"
    t.string "email"
    t.string "id_number"
    t.date "birthday"
    t.string "gender"
    t.string "education"
    t.string "occupation"
    t.bigint "community_id"
    t.string "status", default: "active"
    t.date "enrollment_date"
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["community_id"], name: "index_students_on_community_id"
    t.index ["phone"], name: "index_students_on_phone"
    t.index ["status"], name: "index_students_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "role", default: "operator"
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "versions", force: :cascade do |t|
    t.string "item_type", null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object"
    t.text "object_changes"
    t.datetime "created_at"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  add_foreign_key "assignment_submissions", "assignments"
  add_foreign_key "assignment_submissions", "students"
  add_foreign_key "assignment_submissions", "users", column: "reviewer_id"
  add_foreign_key "assignments", "communities"
  add_foreign_key "assignments", "users", column: "creator_id"
  add_foreign_key "benefit_rules", "users", column: "creator_id"
  add_foreign_key "communities", "users", column: "manager_id"
  add_foreign_key "exam_results", "exams"
  add_foreign_key "exam_results", "students"
  add_foreign_key "exam_results", "users", column: "reviewer_id"
  add_foreign_key "exams", "communities"
  add_foreign_key "export_records", "users", column: "operator_id"
  add_foreign_key "member_profiles", "students"
  add_foreign_key "operation_logs", "users", column: "operator_id"
  add_foreign_key "plagiarism_logs", "assignment_submissions"
  add_foreign_key "plagiarism_logs", "assignment_submissions", column: "source_submission_id"
  add_foreign_key "plagiarism_logs", "assignments"
  add_foreign_key "plagiarism_logs", "students"
  add_foreign_key "plagiarism_logs", "users", column: "handler_id"
  add_foreign_key "plagiarism_logs", "users", column: "responsible_user_id"
  add_foreign_key "redemption_records", "benefit_rules"
  add_foreign_key "redemption_records", "students"
  add_foreign_key "redemption_records", "users", column: "operator_id"
  add_foreign_key "refund_records", "member_profiles"
  add_foreign_key "refund_records", "students"
  add_foreign_key "refund_records", "users", column: "operator_id"
  add_foreign_key "students", "communities"
end
