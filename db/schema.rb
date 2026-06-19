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

ActiveRecord::Schema[8.1].define(version: 2026_06_18_223903) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "attachments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "file_type"
    t.string "name"
    t.datetime "updated_at", null: false
    t.bigint "uploaded_by_id"
    t.bigint "work_order_id", null: false
    t.index ["work_order_id"], name: "index_attachments_on_work_order_id"
  end

  create_table "inspection_photos", force: :cascade do |t|
    t.string "caption"
    t.datetime "created_at", null: false
    t.string "photo_type"
    t.datetime "taken_at"
    t.bigint "taken_by_id"
    t.datetime "updated_at", null: false
    t.bigint "work_order_id", null: false
    t.index ["work_order_id"], name: "index_inspection_photos_on_work_order_id"
  end

  create_table "notes", force: :cascade do |t|
    t.bigint "author_id"
    t.text "content"
    t.datetime "created_at", null: false
    t.boolean "is_private", default: false
    t.datetime "updated_at", null: false
    t.bigint "work_order_id", null: false
    t.index ["work_order_id"], name: "index_notes_on_work_order_id"
  end

  create_table "parts", force: :cascade do |t|
    t.string "brand"
    t.string "category"
    t.decimal "cost_price", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.string "location"
    t.string "name"
    t.integer "safety_stock", default: 0
    t.decimal "selling_price", precision: 10, scale: 2
    t.string "sku"
    t.string "specification"
    t.integer "stock_quantity", default: 0
    t.string "unit"
    t.datetime "updated_at", null: false
    t.index ["sku"], name: "index_parts_on_sku", unique: true
  end

  create_table "quote_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.decimal "discount_rate", precision: 5, scale: 2, default: "0.0"
    t.string "item_type"
    t.string "name"
    t.integer "quantity", default: 1
    t.bigint "quote_id", null: false
    t.decimal "unit_price", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.index ["quote_id"], name: "index_quote_items_on_quote_id"
  end

  create_table "quotes", force: :cascade do |t|
    t.datetime "approved_at"
    t.bigint "approved_by_id"
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.boolean "customer_approved", default: false
    t.string "quote_no"
    t.string "status", default: "draft"
    t.decimal "total_amount", precision: 12, scale: 2
    t.datetime "updated_at", null: false
    t.datetime "valid_until"
    t.bigint "work_order_id", null: false
    t.index ["approved_by_id"], name: "index_quotes_on_approved_by_id"
    t.index ["created_by_id"], name: "index_quotes_on_created_by_id"
    t.index ["quote_no"], name: "index_quotes_on_quote_no", unique: true
    t.index ["work_order_id"], name: "index_quotes_on_work_order_id"
  end

  create_table "stock_alerts", force: :cascade do |t|
    t.text "affected_scope"
    t.datetime "created_at", null: false
    t.bigint "handler_id"
    t.bigint "part_id", null: false
    t.bigint "reassigned_to_id"
    t.datetime "resolved_at"
    t.string "status", default: "pending"
    t.text "supplementary_note"
    t.datetime "updated_at", null: false
    t.bigint "work_order_id", null: false
    t.bigint "work_order_part_id", null: false
    t.index ["part_id"], name: "index_stock_alerts_on_part_id"
    t.index ["work_order_id"], name: "index_stock_alerts_on_work_order_id"
    t.index ["work_order_part_id"], name: "index_stock_alerts_on_work_order_part_id"
  end

  create_table "timeline_events", force: :cascade do |t|
    t.text "content"
    t.datetime "created_at", null: false
    t.string "event_type"
    t.jsonb "metadata", default: {}
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.bigint "work_order_id", null: false
    t.index ["work_order_id"], name: "index_timeline_events_on_work_order_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name"
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "technician"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "work_order_items", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.decimal "labor_fee", precision: 10, scale: 2, default: "0.0"
    t.string "name"
    t.integer "quantity", default: 1
    t.string "status", default: "pending"
    t.bigint "technician_id"
    t.decimal "unit_price", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.bigint "work_order_id", null: false
    t.index ["technician_id"], name: "index_work_order_items_on_technician_id"
    t.index ["work_order_id"], name: "index_work_order_items_on_work_order_id"
  end

  create_table "work_order_parts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.boolean "is_out_of_stock", default: false
    t.bigint "part_id", null: false
    t.integer "quantity", default: 1
    t.boolean "shortage_confirmed", default: false
    t.datetime "shortage_handled_at"
    t.bigint "shortage_handled_by_id"
    t.text "shortage_note"
    t.decimal "unit_price", precision: 10, scale: 2
    t.datetime "updated_at", null: false
    t.bigint "work_order_id", null: false
    t.index ["part_id"], name: "index_work_order_parts_on_part_id"
    t.index ["shortage_handled_by_id"], name: "index_work_order_parts_on_shortage_handled_by_id"
    t.index ["work_order_id"], name: "index_work_order_parts_on_work_order_id"
  end

  create_table "work_orders", force: :cascade do |t|
    t.bigint "assigned_to_id"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.bigint "created_by_id"
    t.string "customer_name"
    t.string "customer_phone"
    t.text "description"
    t.boolean "is_repair", default: false
    t.bigint "parent_work_order_id"
    t.string "priority", default: "normal"
    t.string "status", default: "pending"
    t.decimal "total_amount", precision: 12, scale: 2
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.string "vehicle_brand"
    t.integer "vehicle_mileage"
    t.string "vehicle_model"
    t.string "vehicle_plate"
    t.string "work_order_no"
    t.index ["assigned_to_id"], name: "index_work_orders_on_assigned_to_id"
    t.index ["created_by_id"], name: "index_work_orders_on_created_by_id"
    t.index ["parent_work_order_id"], name: "index_work_orders_on_parent_work_order_id"
    t.index ["user_id"], name: "index_work_orders_on_user_id"
    t.index ["work_order_no"], name: "index_work_orders_on_work_order_no", unique: true
  end

  add_foreign_key "attachments", "work_orders"
  add_foreign_key "inspection_photos", "work_orders"
  add_foreign_key "notes", "work_orders"
  add_foreign_key "quote_items", "quotes"
  add_foreign_key "quotes", "work_orders"
  add_foreign_key "stock_alerts", "parts"
  add_foreign_key "stock_alerts", "work_order_parts"
  add_foreign_key "stock_alerts", "work_orders"
  add_foreign_key "timeline_events", "work_orders"
  add_foreign_key "work_order_items", "work_orders"
  add_foreign_key "work_order_parts", "parts"
  add_foreign_key "work_order_parts", "work_orders"
  add_foreign_key "work_orders", "users"
end
