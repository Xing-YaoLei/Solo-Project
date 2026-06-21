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

ActiveRecord::Schema[8.1].define(version: 2026_06_21_192753) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "case_stages", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_date"
    t.bigint "legal_case_id", null: false
    t.string "name"
    t.text "notes"
    t.integer "order"
    t.datetime "start_date"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["legal_case_id"], name: "index_case_stages_on_legal_case_id"
  end

  create_table "clients", force: :cascade do |t|
    t.text "address"
    t.string "contact_person"
    t.datetime "created_at", null: false
    t.string "email"
    t.string "id_number"
    t.string "name"
    t.text "notes"
    t.string "phone"
    t.string "source_channel"
    t.datetime "updated_at", null: false
  end

  create_table "evidence_attachments", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.text "description"
    t.boolean "is_missing"
    t.bigint "legal_case_id", null: false
    t.text "missing_notes"
    t.string "name"
    t.integer "page_count"
    t.datetime "updated_at", null: false
    t.string "uploaded_by"
    t.index ["legal_case_id"], name: "index_evidence_attachments_on_legal_case_id"
  end

  create_table "follow_ups", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "follow_date"
    t.bigint "legal_case_id", null: false
    t.text "next_step"
    t.string "operator"
    t.datetime "updated_at", null: false
    t.index ["legal_case_id"], name: "index_follow_ups_on_legal_case_id"
  end

  create_table "legal_cases", force: :cascade do |t|
    t.datetime "accept_date"
    t.decimal "amount"
    t.string "case_number"
    t.string "category"
    t.bigint "client_id", null: false
    t.datetime "close_date"
    t.datetime "created_at", null: false
    t.text "description"
    t.boolean "material_missing"
    t.text "missing_details"
    t.string "responsible_person"
    t.string "source_channel"
    t.string "status"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["client_id"], name: "index_legal_cases_on_client_id"
  end

  create_table "review_records", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.bigint "legal_case_id", null: false
    t.text "lessons"
    t.string "operator"
    t.text "result"
    t.datetime "review_date"
    t.datetime "updated_at", null: false
    t.index ["legal_case_id"], name: "index_review_records_on_legal_case_id"
  end

  create_table "status_transitions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "from_status"
    t.bigint "legal_case_id", null: false
    t.string "operator"
    t.text "reason"
    t.string "to_status"
    t.datetime "updated_at", null: false
    t.index ["legal_case_id"], name: "index_status_transitions_on_legal_case_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "case_stages", "legal_cases"
  add_foreign_key "evidence_attachments", "legal_cases"
  add_foreign_key "follow_ups", "legal_cases"
  add_foreign_key "legal_cases", "clients"
  add_foreign_key "review_records", "legal_cases"
  add_foreign_key "status_transitions", "legal_cases"
end
