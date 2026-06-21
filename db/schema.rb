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

ActiveRecord::Schema[8.1].define(version: 2026_06_21_181521) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "content_versions", force: :cascade do |t|
    t.string "change_summary"
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.bigint "editor_id", null: false
    t.datetime "updated_at", null: false
    t.integer "version"
    t.index ["document_id"], name: "index_content_versions_on_document_id"
    t.index ["editor_id"], name: "index_content_versions_on_editor_id"
  end

  create_table "documents", force: :cascade do |t|
    t.datetime "archived_at"
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "creator_id", null: false
    t.string "doc_type"
    t.bigint "reviewer_id"
    t.string "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["creator_id"], name: "index_documents_on_creator_id"
    t.index ["reviewer_id"], name: "index_documents_on_reviewer_id"
  end

  create_table "exception_orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.bigint "handler_id"
    t.string "handling_result"
    t.text "impact_scope"
    t.string "order_no"
    t.text "responsibility"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_exception_orders_on_document_id"
    t.index ["handler_id"], name: "index_exception_orders_on_handler_id"
    t.index ["order_no"], name: "index_exception_orders_on_order_no"
  end

  create_table "interaction_records", force: :cascade do |t|
    t.string "action_type"
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.bigint "operator_id", null: false
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_interaction_records_on_document_id"
    t.index ["operator_id"], name: "index_interaction_records_on_operator_id"
  end

  create_table "publish_schedules", force: :cascade do |t|
    t.datetime "actual_publish_at"
    t.string "channel"
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.text "note"
    t.datetime "planned_publish_at"
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_publish_schedules_on_document_id"
  end

  create_table "review_opinions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.text "opinion"
    t.string "result"
    t.datetime "reviewed_at"
    t.bigint "reviewer_id", null: false
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_review_opinions_on_document_id"
    t.index ["reviewer_id"], name: "index_review_opinions_on_reviewer_id"
  end

  create_table "risk_word_hits", force: :cascade do |t|
    t.text "context"
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.integer "position"
    t.bigint "risk_word_id", null: false
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_risk_word_hits_on_document_id"
    t.index ["risk_word_id"], name: "index_risk_word_hits_on_risk_word_id"
  end

  create_table "risk_words", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "risk_level"
    t.datetime "updated_at", null: false
    t.string "word"
    t.index ["word"], name: "index_risk_words_on_word"
  end

  create_table "status_histories", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "document_id", null: false
    t.string "from_status"
    t.bigint "operator_id", null: false
    t.text "remark"
    t.string "to_status"
    t.datetime "updated_at", null: false
    t.index ["document_id"], name: "index_status_histories_on_document_id"
    t.index ["operator_id"], name: "index_status_histories_on_operator_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "password_digest"
    t.string "role"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email"
  end

  create_table "versions", force: :cascade do |t|
    t.datetime "created_at"
    t.string "event", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.text "object"
    t.string "whodunnit"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  add_foreign_key "content_versions", "documents"
  add_foreign_key "content_versions", "users", column: "editor_id"
  add_foreign_key "documents", "users", column: "creator_id"
  add_foreign_key "documents", "users", column: "reviewer_id"
  add_foreign_key "exception_orders", "documents"
  add_foreign_key "exception_orders", "users", column: "handler_id"
  add_foreign_key "interaction_records", "documents"
  add_foreign_key "interaction_records", "users", column: "operator_id"
  add_foreign_key "publish_schedules", "documents"
  add_foreign_key "review_opinions", "documents"
  add_foreign_key "review_opinions", "users", column: "reviewer_id"
  add_foreign_key "risk_word_hits", "documents"
  add_foreign_key "risk_word_hits", "risk_words"
  add_foreign_key "status_histories", "documents"
  add_foreign_key "status_histories", "users", column: "operator_id"
end
