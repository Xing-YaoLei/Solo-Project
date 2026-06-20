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

ActiveRecord::Schema[8.1].define(version: 2026_06_21_000007) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "check_in_records", force: :cascade do |t|
    t.string "check_in_method"
    t.datetime "check_in_time"
    t.datetime "created_at", null: false
    t.bigint "event_id", null: false
    t.text "note"
    t.bigint "operator_id", null: false
    t.bigint "ticket_order_id", null: false
    t.bigint "ticket_type_id", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_check_in_records_on_event_id"
    t.index ["operator_id"], name: "index_check_in_records_on_operator_id"
    t.index ["ticket_order_id"], name: "index_check_in_records_on_ticket_order_id"
    t.index ["ticket_type_id"], name: "index_check_in_records_on_ticket_type_id"
  end

  create_table "dispute_logs", force: :cascade do |t|
    t.string "action_type"
    t.datetime "closed_at"
    t.datetime "created_at", null: false
    t.text "detail"
    t.bigint "operator_id", null: false
    t.text "reason"
    t.bigint "refund_dispute_id", null: false
    t.datetime "updated_at", null: false
    t.index ["action_type"], name: "index_dispute_logs_on_action_type"
    t.index ["operator_id"], name: "index_dispute_logs_on_operator_id"
    t.index ["refund_dispute_id"], name: "index_dispute_logs_on_refund_dispute_id"
  end

  create_table "events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_time"
    t.string "location"
    t.string "name"
    t.datetime "start_time"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "refund_disputes", force: :cascade do |t|
    t.datetime "closed_at"
    t.datetime "created_at", null: false
    t.string "handler_action"
    t.bigint "handler_id", null: false
    t.text "handler_remark"
    t.text "reason"
    t.string "reporter_name"
    t.string "reporter_phone"
    t.string "status"
    t.bigint "ticket_order_id", null: false
    t.datetime "updated_at", null: false
    t.index ["handler_id"], name: "index_refund_disputes_on_handler_id"
    t.index ["ticket_order_id"], name: "index_refund_disputes_on_ticket_order_id"
  end

  create_table "sponsors", force: :cascade do |t|
    t.string "contact_email"
    t.string "contact_name"
    t.string "contact_phone"
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "event_id", null: false
    t.string "level"
    t.string "logo"
    t.string "name"
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_sponsors_on_event_id"
  end

  create_table "ticket_orders", force: :cascade do |t|
    t.string "buyer_email"
    t.string "buyer_name"
    t.string "buyer_phone"
    t.datetime "created_at", null: false
    t.bigint "event_id", null: false
    t.string "order_no"
    t.integer "quantity"
    t.text "remark"
    t.string "status"
    t.bigint "ticket_type_id", null: false
    t.decimal "total_amount"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["event_id"], name: "index_ticket_orders_on_event_id"
    t.index ["ticket_type_id"], name: "index_ticket_orders_on_ticket_type_id"
    t.index ["user_id"], name: "index_ticket_orders_on_user_id"
  end

  create_table "ticket_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "event_id", null: false
    t.string "name"
    t.decimal "price"
    t.integer "quantity"
    t.jsonb "rules"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["event_id"], name: "index_ticket_types_on_event_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "staff"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  create_table "versions", force: :cascade do |t|
    t.datetime "created_at"
    t.string "event", null: false
    t.bigint "item_id", null: false
    t.string "item_type", null: false
    t.text "object"
    t.text "object_changes"
    t.string "whodunnit"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  add_foreign_key "check_in_records", "events"
  add_foreign_key "check_in_records", "ticket_orders"
  add_foreign_key "check_in_records", "ticket_types"
  add_foreign_key "check_in_records", "users", column: "operator_id"
  add_foreign_key "dispute_logs", "refund_disputes"
  add_foreign_key "dispute_logs", "users", column: "operator_id"
  add_foreign_key "refund_disputes", "ticket_orders"
  add_foreign_key "refund_disputes", "users", column: "handler_id"
  add_foreign_key "sponsors", "events"
  add_foreign_key "ticket_orders", "events"
  add_foreign_key "ticket_orders", "ticket_types"
  add_foreign_key "ticket_orders", "users"
  add_foreign_key "ticket_types", "events"
end
