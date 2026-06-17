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

ActiveRecord::Schema[7.2].define(version: 2026_06_17_000013) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "access_records", force: :cascade do |t|
    t.string "plate_number", null: false
    t.string "direction", null: false
    t.string "access_type", default: "vehicle", null: false
    t.datetime "accessed_at", null: false
    t.bigint "parking_spot_id"
    t.string "gate_name"
    t.string "image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["accessed_at"], name: "index_access_records_on_accessed_at"
    t.index ["parking_spot_id"], name: "index_access_records_on_parking_spot_id"
    t.index ["plate_number"], name: "index_access_records_on_plate_number"
  end

  create_table "downtime_actions", force: :cascade do |t|
    t.bigint "equipment_downtime_id", null: false
    t.text "action_description", null: false
    t.string "performed_by", null: false
    t.datetime "performed_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["equipment_downtime_id"], name: "index_downtime_actions_on_equipment_downtime_id"
  end

  create_table "equipment_downtimes", force: :cascade do |t|
    t.string "equipment_name", null: false
    t.string "equipment_type", null: false
    t.string "reason", null: false
    t.text "description"
    t.datetime "started_at", null: false
    t.datetime "closed_at"
    t.string "status", default: "active", null: false
    t.string "resolved_by"
    t.text "action_taken"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["started_at"], name: "index_equipment_downtimes_on_started_at"
    t.index ["status"], name: "index_equipment_downtimes_on_status"
  end

  create_table "inspection_checkpoints", force: :cascade do |t|
    t.bigint "inspection_route_id", null: false
    t.string "location", null: false
    t.integer "checkpoint_order", null: false
    t.string "status", default: "pending", null: false
    t.datetime "checked_at"
    t.text "remark"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["inspection_route_id", "checkpoint_order"], name: "idx_on_inspection_route_id_checkpoint_order_1949329f6d", unique: true
    t.index ["inspection_route_id"], name: "index_inspection_checkpoints_on_inspection_route_id"
  end

  create_table "inspection_routes", force: :cascade do |t|
    t.string "name", null: false
    t.string "inspector_name", null: false
    t.datetime "scheduled_at", null: false
    t.datetime "started_at"
    t.datetime "completed_at"
    t.string "status", default: "pending", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["scheduled_at"], name: "index_inspection_routes_on_scheduled_at"
  end

  create_table "monthly_turnover_reports", force: :cascade do |t|
    t.date "report_month", null: false
    t.string "generated_by", null: false
    t.jsonb "filter_conditions", default: {}, null: false
    t.datetime "generated_at", null: false
    t.string "file_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "status", default: "pending"
    t.text "error_message"
    t.index ["report_month"], name: "index_monthly_turnover_reports_on_report_month"
  end

  create_table "notifications", force: :cascade do |t|
    t.string "recipient_role", null: false
    t.string "title", null: false
    t.text "message", null: false
    t.string "channel", default: "in_app", null: false
    t.string "notifiable_type"
    t.bigint "notifiable_id"
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["read_at"], name: "index_notifications_on_read_at"
    t.index ["recipient_role"], name: "index_notifications_on_recipient_role"
  end

  create_table "parking_bills", force: :cascade do |t|
    t.string "bill_number"
    t.bigint "parking_spot_id", null: false
    t.bigint "access_record_id"
    t.string "plate_number", null: false
    t.string "bill_type", default: "hourly", null: false
    t.string "status", default: "unpaid", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.datetime "check_in_at"
    t.datetime "check_out_at"
    t.datetime "paid_at"
    t.string "payment_method"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["access_record_id"], name: "index_parking_bills_on_access_record_id"
    t.index ["bill_number"], name: "index_parking_bills_on_bill_number", unique: true
    t.index ["check_in_at"], name: "index_parking_bills_on_check_in_at"
    t.index ["parking_spot_id"], name: "index_parking_bills_on_parking_spot_id"
    t.index ["status"], name: "index_parking_bills_on_status"
  end

  create_table "parking_spots", force: :cascade do |t|
    t.string "spot_number", null: false
    t.string "zone", null: false
    t.string "spot_type", default: "regular", null: false
    t.boolean "occupied", default: false
    t.string "floor"
    t.decimal "monthly_rate", precision: 10, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["spot_number"], name: "index_parking_spots_on_spot_number", unique: true
    t.index ["zone"], name: "index_parking_spots_on_zone"
  end

  create_table "tenant_contracts", force: :cascade do |t|
    t.string "contract_number", null: false
    t.bigint "tenant_id", null: false
    t.bigint "parking_spot_id"
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.decimal "rent_amount", precision: 10, scale: 2, null: false
    t.string "status", default: "active"
    t.text "terms"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["contract_number"], name: "index_tenant_contracts_on_contract_number", unique: true
    t.index ["parking_spot_id"], name: "index_tenant_contracts_on_parking_spot_id"
    t.index ["tenant_id"], name: "index_tenant_contracts_on_tenant_id"
  end

  create_table "tenants", force: :cascade do |t|
    t.string "name", null: false
    t.string "contact_person", null: false
    t.string "contact_phone", null: false
    t.string "email"
    t.string "address"
    t.text "remark"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "versions", force: :cascade do |t|
    t.string "item_type", null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.jsonb "object"
    t.jsonb "object_changes"
    t.integer "operator_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
    t.index ["operator_id"], name: "index_versions_on_operator_id"
  end

  add_foreign_key "access_records", "parking_spots"
  add_foreign_key "downtime_actions", "equipment_downtimes"
  add_foreign_key "inspection_checkpoints", "inspection_routes"
  add_foreign_key "parking_bills", "access_records"
  add_foreign_key "parking_bills", "parking_spots"
  add_foreign_key "tenant_contracts", "parking_spots"
  add_foreign_key "tenant_contracts", "tenants"
end
