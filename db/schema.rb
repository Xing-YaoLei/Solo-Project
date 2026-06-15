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

ActiveRecord::Schema[8.1].define(version: 2026_06_15_195055) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "appeals", force: :cascade do |t|
    t.integer "appeal_type"
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "enrollment_id", null: false
    t.text "handle_result"
    t.datetime "handled_at"
    t.bigint "handled_by_id"
    t.integer "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["enrollment_id"], name: "index_appeals_on_enrollment_id"
    t.index ["handled_by_id"], name: "index_appeals_on_handled_by_id"
    t.index ["user_id"], name: "index_appeals_on_user_id"
  end

  create_table "certificate_issuances", force: :cascade do |t|
    t.bigint "certificate_id", null: false
    t.string "certificate_no"
    t.datetime "created_at", null: false
    t.bigint "enrollment_id", null: false
    t.datetime "issued_at"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["certificate_id"], name: "index_certificate_issuances_on_certificate_id"
    t.index ["enrollment_id"], name: "index_certificate_issuances_on_enrollment_id"
    t.index ["user_id"], name: "index_certificate_issuances_on_user_id"
  end

  create_table "certificates", force: :cascade do |t|
    t.integer "certificate_type"
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.integer "status"
    t.string "template_url"
    t.string "title"
    t.datetime "updated_at", null: false
    t.integer "validity_period"
    t.index ["course_id"], name: "index_certificates_on_course_id"
  end

  create_table "channel_commissions", force: :cascade do |t|
    t.decimal "amount"
    t.bigint "channel_id", null: false
    t.decimal "commission_amount"
    t.decimal "commission_rate"
    t.datetime "created_at", null: false
    t.bigint "order_id", null: false
    t.datetime "settled_at"
    t.bigint "settlement_id", null: false
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["channel_id"], name: "index_channel_commissions_on_channel_id"
    t.index ["order_id"], name: "index_channel_commissions_on_order_id"
    t.index ["settlement_id"], name: "index_channel_commissions_on_settlement_id"
  end

  create_table "channels", force: :cascade do |t|
    t.string "code"
    t.decimal "commission_rate"
    t.string "contact_name"
    t.string "contact_phone"
    t.datetime "created_at", null: false
    t.string "name"
    t.integer "status"
    t.datetime "updated_at", null: false
  end

  create_table "chapters", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "position"
    t.integer "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_chapters_on_course_id"
  end

  create_table "courses", force: :cascade do |t|
    t.bigint "channel_id", null: false
    t.string "cover_url"
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "duration"
    t.decimal "original_price"
    t.decimal "price"
    t.integer "status"
    t.string "subtitle"
    t.bigint "teacher_id", null: false
    t.string "title"
    t.integer "total_exams"
    t.integer "total_lessons"
    t.datetime "updated_at", null: false
    t.index ["channel_id"], name: "index_courses_on_channel_id"
    t.index ["teacher_id"], name: "index_courses_on_teacher_id"
  end

  create_table "enrollments", force: :cascade do |t|
    t.boolean "certificate_issued"
    t.bigint "channel_id", null: false
    t.integer "completed_lessons_count"
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.datetime "enrolled_at"
    t.boolean "exam_passed"
    t.datetime "expired_at"
    t.bigint "order_id"
    t.decimal "progress"
    t.integer "status"
    t.integer "total_lessons_count"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["channel_id"], name: "index_enrollments_on_channel_id"
    t.index ["course_id"], name: "index_enrollments_on_course_id"
    t.index ["order_id"], name: "index_enrollments_on_order_id"
    t.index ["user_id"], name: "index_enrollments_on_user_id"
  end

  create_table "exam_records", force: :cascade do |t|
    t.integer "attempt_number"
    t.datetime "created_at", null: false
    t.datetime "end_time"
    t.bigint "enrollment_id", null: false
    t.bigint "exam_id", null: false
    t.boolean "is_passed"
    t.decimal "score"
    t.datetime "start_time"
    t.integer "status"
    t.decimal "total_score"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["enrollment_id"], name: "index_exam_records_on_enrollment_id"
    t.index ["exam_id"], name: "index_exam_records_on_exam_id"
    t.index ["user_id"], name: "index_exam_records_on_user_id"
  end

  create_table "exams", force: :cascade do |t|
    t.integer "attempt_limit"
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "duration"
    t.decimal "passing_score"
    t.bigint "question_bank_id", null: false
    t.integer "status"
    t.string "title"
    t.decimal "total_score"
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_exams_on_course_id"
    t.index ["question_bank_id"], name: "index_exams_on_question_bank_id"
  end

  create_table "extensions", force: :cascade do |t|
    t.datetime "approved_at"
    t.bigint "approved_by_id"
    t.datetime "created_at", null: false
    t.bigint "enrollment_id", null: false
    t.integer "extend_days"
    t.datetime "new_expired_at"
    t.datetime "original_expired_at"
    t.string "reason"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["approved_by_id"], name: "index_extensions_on_approved_by_id"
    t.index ["enrollment_id"], name: "index_extensions_on_enrollment_id"
  end

  create_table "follow_ups", force: :cascade do |t|
    t.bigint "assistant_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "enrollment_id", null: false
    t.datetime "next_follow_up_at"
    t.string "reason"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["assistant_id"], name: "index_follow_ups_on_assistant_id"
    t.index ["enrollment_id"], name: "index_follow_ups_on_enrollment_id"
  end

  create_table "lesson_progresses", force: :cascade do |t|
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.bigint "enrollment_id", null: false
    t.bigint "lesson_id", null: false
    t.datetime "started_at"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.integer "watch_duration"
    t.index ["enrollment_id"], name: "index_lesson_progresses_on_enrollment_id"
    t.index ["lesson_id"], name: "index_lesson_progresses_on_lesson_id"
  end

  create_table "lessons", force: :cascade do |t|
    t.bigint "chapter_id", null: false
    t.text "content"
    t.datetime "created_at", null: false
    t.integer "duration"
    t.integer "lesson_type"
    t.integer "position"
    t.integer "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.string "video_url"
    t.index ["chapter_id"], name: "index_lessons_on_chapter_id"
  end

  create_table "live_sessions", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_time"
    t.string "playback_url"
    t.datetime "start_time"
    t.integer "status"
    t.string "stream_url"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_live_sessions_on_course_id"
  end

  create_table "makeup_exams", force: :cascade do |t|
    t.datetime "approved_at"
    t.bigint "approved_by_id"
    t.datetime "created_at", null: false
    t.bigint "enrollment_id", null: false
    t.bigint "exam_id", null: false
    t.bigint "exam_record_id", null: false
    t.datetime "expires_at"
    t.string "reason"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["approved_by_id"], name: "index_makeup_exams_on_approved_by_id"
    t.index ["enrollment_id"], name: "index_makeup_exams_on_enrollment_id"
    t.index ["exam_id"], name: "index_makeup_exams_on_exam_id"
    t.index ["exam_record_id"], name: "index_makeup_exams_on_exam_record_id"
  end

  create_table "orders", force: :cascade do |t|
    t.decimal "amount"
    t.bigint "channel_id", null: false
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.decimal "discount_amount"
    t.string "order_no"
    t.decimal "original_amount"
    t.datetime "paid_at"
    t.integer "pay_method"
    t.decimal "refund_amount"
    t.datetime "refunded_at"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["channel_id"], name: "index_orders_on_channel_id"
    t.index ["course_id"], name: "index_orders_on_course_id"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "practice_records", force: :cascade do |t|
    t.datetime "answered_at"
    t.datetime "created_at", null: false
    t.bigint "enrollment_id", null: false
    t.boolean "is_correct"
    t.bigint "question_bank_id", null: false
    t.bigint "question_id", null: false
    t.datetime "updated_at", null: false
    t.text "user_answer"
    t.index ["enrollment_id"], name: "index_practice_records_on_enrollment_id"
    t.index ["question_bank_id"], name: "index_practice_records_on_question_bank_id"
    t.index ["question_id"], name: "index_practice_records_on_question_id"
  end

  create_table "qa_replies", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.boolean "is_instructor"
    t.bigint "qa_thread_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["qa_thread_id"], name: "index_qa_replies_on_qa_thread_id"
    t.index ["user_id"], name: "index_qa_replies_on_user_id"
  end

  create_table "qa_threads", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "enrollment_id", null: false
    t.datetime "last_reply_at"
    t.bigint "lesson_id", null: false
    t.integer "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["enrollment_id"], name: "index_qa_threads_on_enrollment_id"
    t.index ["lesson_id"], name: "index_qa_threads_on_lesson_id"
    t.index ["user_id"], name: "index_qa_threads_on_user_id"
  end

  create_table "question_banks", force: :cascade do |t|
    t.bigint "course_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "question_count"
    t.integer "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["course_id"], name: "index_question_banks_on_course_id"
  end

  create_table "questions", force: :cascade do |t|
    t.text "analysis"
    t.text "answer"
    t.text "content"
    t.datetime "created_at", null: false
    t.integer "difficulty"
    t.json "options"
    t.bigint "question_bank_id", null: false
    t.integer "question_type"
    t.decimal "score"
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["question_bank_id"], name: "index_questions_on_question_bank_id"
  end

  create_table "settlement_items", force: :cascade do |t|
    t.decimal "amount"
    t.decimal "commission_amount"
    t.datetime "created_at", null: false
    t.bigint "enrollment_id", null: false
    t.integer "item_type"
    t.bigint "order_id", null: false
    t.bigint "settlement_id", null: false
    t.integer "status"
    t.datetime "updated_at", null: false
    t.index ["enrollment_id"], name: "index_settlement_items_on_enrollment_id"
    t.index ["order_id"], name: "index_settlement_items_on_order_id"
    t.index ["settlement_id"], name: "index_settlement_items_on_settlement_id"
  end

  create_table "settlements", force: :cascade do |t|
    t.decimal "channel_commission_amount"
    t.integer "completed_courses_count"
    t.datetime "created_at", null: false
    t.decimal "net_revenue"
    t.integer "passed_exams_count"
    t.date "period_end"
    t.date "period_start"
    t.decimal "refund_amount"
    t.integer "refund_count"
    t.datetime "settled_at"
    t.integer "status"
    t.decimal "total_amount"
    t.integer "total_orders"
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "email"
    t.datetime "last_login_at"
    t.string "name"
    t.string "password_digest"
    t.string "phone"
    t.integer "role"
    t.integer "status"
    t.datetime "updated_at", null: false
  end

  add_foreign_key "appeals", "enrollments"
  add_foreign_key "appeals", "users"
  add_foreign_key "appeals", "users", column: "handled_by_id"
  add_foreign_key "certificate_issuances", "certificates"
  add_foreign_key "certificate_issuances", "enrollments"
  add_foreign_key "certificate_issuances", "users"
  add_foreign_key "certificates", "courses"
  add_foreign_key "channel_commissions", "channels"
  add_foreign_key "channel_commissions", "orders"
  add_foreign_key "channel_commissions", "settlements"
  add_foreign_key "chapters", "courses"
  add_foreign_key "courses", "channels"
  add_foreign_key "courses", "users", column: "teacher_id"
  add_foreign_key "enrollments", "channels"
  add_foreign_key "enrollments", "courses"
  add_foreign_key "enrollments", "users"
  add_foreign_key "exam_records", "enrollments"
  add_foreign_key "exam_records", "exams"
  add_foreign_key "exam_records", "users"
  add_foreign_key "exams", "courses"
  add_foreign_key "exams", "question_banks"
  add_foreign_key "extensions", "enrollments"
  add_foreign_key "extensions", "users", column: "approved_by_id"
  add_foreign_key "follow_ups", "enrollments"
  add_foreign_key "follow_ups", "users", column: "assistant_id"
  add_foreign_key "lesson_progresses", "enrollments"
  add_foreign_key "lesson_progresses", "lessons"
  add_foreign_key "lessons", "chapters"
  add_foreign_key "live_sessions", "courses"
  add_foreign_key "makeup_exams", "enrollments"
  add_foreign_key "makeup_exams", "exam_records"
  add_foreign_key "makeup_exams", "exams"
  add_foreign_key "makeup_exams", "users", column: "approved_by_id"
  add_foreign_key "orders", "channels"
  add_foreign_key "orders", "courses"
  add_foreign_key "orders", "users"
  add_foreign_key "practice_records", "enrollments"
  add_foreign_key "practice_records", "question_banks"
  add_foreign_key "practice_records", "questions"
  add_foreign_key "qa_replies", "qa_threads"
  add_foreign_key "qa_replies", "users"
  add_foreign_key "qa_threads", "enrollments"
  add_foreign_key "qa_threads", "lessons"
  add_foreign_key "qa_threads", "users"
  add_foreign_key "question_banks", "courses"
  add_foreign_key "questions", "question_banks"
  add_foreign_key "settlement_items", "enrollments"
  add_foreign_key "settlement_items", "orders"
  add_foreign_key "settlement_items", "settlements"
end
