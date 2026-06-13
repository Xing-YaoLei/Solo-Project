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

ActiveRecord::Schema[7.2].define(version: 2026_06_13_000008) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "activity_logs", force: :cascade do |t|
    t.bigint "pickup_order_id", null: false
    t.bigint "user_id"
    t.string "action", null: false
    t.string "from_status"
    t.string "to_status"
    t.text "details"
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action"], name: "index_activity_logs_on_action"
    t.index ["created_at"], name: "index_activity_logs_on_created_at"
    t.index ["pickup_order_id"], name: "index_activity_logs_on_pickup_order_id"
    t.index ["user_id"], name: "index_activity_logs_on_user_id"
  end

  create_table "after_sales_proofs", force: :cascade do |t|
    t.bigint "pickup_order_id", null: false
    t.bigint "pickup_item_id"
    t.string "proof_type", null: false
    t.string "description"
    t.bigint "uploaded_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pickup_item_id"], name: "index_after_sales_proofs_on_pickup_item_id"
    t.index ["pickup_order_id"], name: "index_after_sales_proofs_on_pickup_order_id"
    t.index ["proof_type"], name: "index_after_sales_proofs_on_proof_type"
    t.index ["uploaded_by_id"], name: "index_after_sales_proofs_on_uploaded_by_id"
  end

  create_table "daily_summaries", force: :cascade do |t|
    t.date "summary_date", null: false
    t.string "source"
    t.integer "total_orders", default: 0
    t.integer "completed_orders", default: 0
    t.integer "on_time_orders", default: 0
    t.integer "delayed_orders", default: 0
    t.integer "shortage_orders", default: 0
    t.decimal "on_time_rate", precision: 5, scale: 2, default: "0.0"
    t.jsonb "operator_stats", default: {}
    t.jsonb "abnormal_reason_stats", default: {}
    t.jsonb "product_tag_stats", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["summary_date", "source"], name: "index_daily_summaries_on_summary_date_and_source", unique: true
  end

  create_table "pickup_items", force: :cascade do |t|
    t.bigint "pickup_order_id", null: false
    t.string "product_name", null: false
    t.string "product_code"
    t.string "product_tag", null: false
    t.integer "expected_quantity", default: 0, null: false
    t.integer "actual_quantity", default: 0
    t.integer "shortage_quantity", default: 0
    t.decimal "unit_price", precision: 10, scale: 2, default: "0.0"
    t.decimal "total_amount", precision: 10, scale: 2, default: "0.0"
    t.string "status", default: "normal"
    t.text "remark"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pickup_order_id"], name: "index_pickup_items_on_pickup_order_id"
    t.index ["product_tag"], name: "index_pickup_items_on_product_tag"
  end

  create_table "pickup_orders", force: :cascade do |t|
    t.string "pickup_code", null: false
    t.string "customer_name", null: false
    t.string "customer_phone"
    t.string "source", null: false
    t.string "status", default: "pending"
    t.string "sub_status"
    t.datetime "submitted_at"
    t.datetime "processed_at"
    t.datetime "reviewed_at"
    t.datetime "closed_at"
    t.datetime "fulfillment_time"
    t.datetime "estimated_pickup_time"
    t.datetime "actual_pickup_time"
    t.bigint "operator_id"
    t.bigint "reviewer_id"
    t.text "notes"
    t.boolean "has_shortage", default: false
    t.string "abnormal_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_pickup_orders_on_created_at"
    t.index ["operator_id"], name: "index_pickup_orders_on_operator_id"
    t.index ["pickup_code"], name: "index_pickup_orders_on_pickup_code", unique: true
    t.index ["reviewer_id"], name: "index_pickup_orders_on_reviewer_id"
    t.index ["source"], name: "index_pickup_orders_on_source"
    t.index ["status"], name: "index_pickup_orders_on_status"
  end

  create_table "shortage_records", force: :cascade do |t|
    t.bigint "pickup_order_id", null: false
    t.bigint "pickup_item_id", null: false
    t.integer "shortage_quantity", default: 0, null: false
    t.string "reason", null: false
    t.string "handling_method"
    t.string "status", default: "pending"
    t.decimal "compensation_amount", precision: 10, scale: 2, default: "0.0"
    t.bigint "handled_by_id"
    t.datetime "handled_at"
    t.text "remark"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["handled_by_id"], name: "index_shortage_records_on_handled_by_id"
    t.index ["pickup_item_id"], name: "index_shortage_records_on_pickup_item_id"
    t.index ["pickup_order_id"], name: "index_shortage_records_on_pickup_order_id"
    t.index ["reason"], name: "index_shortage_records_on_reason"
    t.index ["status"], name: "index_shortage_records_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "role", default: "operator"
    t.string "password_digest"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "activity_logs", "pickup_orders"
  add_foreign_key "activity_logs", "users"
  add_foreign_key "after_sales_proofs", "pickup_items"
  add_foreign_key "after_sales_proofs", "pickup_orders"
  add_foreign_key "after_sales_proofs", "users", column: "uploaded_by_id"
  add_foreign_key "pickup_items", "pickup_orders"
  add_foreign_key "pickup_orders", "users", column: "operator_id"
  add_foreign_key "pickup_orders", "users", column: "reviewer_id"
  add_foreign_key "shortage_records", "pickup_items"
  add_foreign_key "shortage_records", "pickup_orders"
  add_foreign_key "shortage_records", "users", column: "handled_by_id"
end
