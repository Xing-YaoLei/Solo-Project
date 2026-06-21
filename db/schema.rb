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

ActiveRecord::Schema[8.1].define(version: 2026_06_22_000003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "amount_audit_logs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "change_reason"
    t.string "change_type"
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}
    t.decimal "new_amount", precision: 12, scale: 2, default: "0.0"
    t.decimal "old_amount", precision: 12, scale: 2, default: "0.0"
    t.uuid "operator_id", null: false
    t.uuid "settlement_id", null: false
    t.datetime "updated_at", null: false
    t.index ["change_type"], name: "index_amount_audit_logs_on_change_type"
    t.index ["operator_id"], name: "index_amount_audit_logs_on_operator_id"
    t.index ["settlement_id"], name: "index_amount_audit_logs_on_settlement_id"
  end

  create_table "approval_nodes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.boolean "active", default: true
    t.string "approver_role"
    t.jsonb "conditions", default: {}
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "order", default: 0
    t.uuid "parent_id"
    t.decimal "threshold_amount", precision: 12, scale: 2
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_approval_nodes_on_active"
    t.index ["approver_role"], name: "index_approval_nodes_on_approver_role"
    t.index ["order"], name: "index_approval_nodes_on_order"
    t.index ["parent_id"], name: "index_approval_nodes_on_parent_id"
  end

  create_table "approval_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "approval_node_id", null: false
    t.uuid "approver_id", null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.integer "decision", default: 0, null: false
    t.uuid "settlement_id", null: false
    t.datetime "updated_at", null: false
    t.index ["approval_node_id"], name: "index_approval_records_on_approval_node_id"
    t.index ["approver_id"], name: "index_approval_records_on_approver_id"
    t.index ["decision"], name: "index_approval_records_on_decision"
    t.index ["settlement_id"], name: "index_approval_records_on_settlement_id"
  end

  create_table "contract_attachments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "effective_date"
    t.datetime "expiry_date"
    t.string "file_name"
    t.string "file_type"
    t.uuid "merchant_id", null: false
    t.datetime "updated_at", null: false
    t.uuid "uploader_id", null: false
    t.string "version"
    t.index ["effective_date"], name: "index_contract_attachments_on_effective_date"
    t.index ["expiry_date"], name: "index_contract_attachments_on_expiry_date"
    t.index ["file_type"], name: "index_contract_attachments_on_file_type"
    t.index ["merchant_id"], name: "index_contract_attachments_on_merchant_id"
    t.index ["uploader_id"], name: "index_contract_attachments_on_uploader_id"
  end

  create_table "delivery_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.datetime "delivery_time"
    t.uuid "merchant_id", null: false
    t.string "order_no", null: false
    t.uuid "rider_id"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["delivery_time"], name: "index_delivery_orders_on_delivery_time"
    t.index ["merchant_id"], name: "index_delivery_orders_on_merchant_id"
    t.index ["order_no"], name: "index_delivery_orders_on_order_no", unique: true
    t.index ["rider_id"], name: "index_delivery_orders_on_rider_id"
    t.index ["status"], name: "index_delivery_orders_on_status"
  end

  create_table "discrepancies", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.text "comment"
    t.jsonb "comparison_data", default: {}
    t.datetime "created_at", null: false
    t.text "description"
    t.decimal "difference_amount", precision: 12, scale: 2, default: "0.0"
    t.text "reason"
    t.string "resolution_type"
    t.datetime "resolved_at"
    t.uuid "resolved_by"
    t.uuid "settlement_id", null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_discrepancies_on_created_at"
    t.index ["resolved_by"], name: "index_discrepancies_on_resolved_by"
    t.index ["settlement_id"], name: "index_discrepancies_on_settlement_id"
    t.index ["status"], name: "index_discrepancies_on_status"
  end

  create_table "filter_configs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.jsonb "conditions", default: {}
    t.datetime "created_at", null: false
    t.boolean "is_default", default: false
    t.string "name", null: false
    t.string "target_model", null: false
    t.datetime "updated_at", null: false
    t.uuid "user_id", null: false
    t.index ["is_default"], name: "index_filter_configs_on_is_default"
    t.index ["target_model"], name: "index_filter_configs_on_target_model"
    t.index ["user_id"], name: "index_filter_configs_on_user_id"
  end

  create_table "merchants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "city_id"
    t.string "contact"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "phone"
    t.jsonb "settlement_config", default: {}
    t.datetime "updated_at", null: false
    t.index ["city_id"], name: "index_merchants_on_city_id"
    t.index ["name"], name: "index_merchants_on_name"
  end

  create_table "settlement_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.uuid "delivery_order_id"
    t.text "description"
    t.jsonb "details", default: {}
    t.string "item_type"
    t.uuid "settlement_id", null: false
    t.datetime "updated_at", null: false
    t.index ["delivery_order_id"], name: "index_settlement_items_on_delivery_order_id"
    t.index ["item_type"], name: "index_settlement_items_on_item_type"
    t.index ["settlement_id"], name: "index_settlement_items_on_settlement_id"
  end

  create_table "settlements", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "difference_amount", precision: 12, scale: 2, default: "0.0"
    t.uuid "handler_id"
    t.decimal "merchant_amount", precision: 12, scale: 2, default: "0.0"
    t.uuid "merchant_id", null: false
    t.jsonb "metadata", default: {}
    t.integer "order_count", default: 0
    t.date "payment_date"
    t.string "payment_method", default: "bank_transfer"
    t.string "period", null: false
    t.integer "status", default: 0, null: false
    t.decimal "system_amount", precision: 12, scale: 2, default: "0.0"
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_settlements_on_created_at"
    t.index ["handler_id"], name: "index_settlements_on_handler_id"
    t.index ["merchant_id", "period"], name: "index_settlements_on_merchant_id_and_period", unique: true
    t.index ["payment_date"], name: "index_settlements_on_payment_date"
    t.index ["status"], name: "index_settlements_on_status"
  end

  create_table "supplement_materials", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.uuid "discrepancy_id", null: false
    t.string "file_url"
    t.jsonb "metadata", default: {}
    t.datetime "updated_at", null: false
    t.uuid "uploader_id", null: false
    t.index ["discrepancy_id"], name: "index_supplement_materials_on_discrepancy_id"
    t.index ["uploader_id"], name: "index_supplement_materials_on_uploader_id"
  end

  create_table "todo_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "assignee_id", null: false
    t.uuid "assigner_id"
    t.datetime "completed_at"
    t.text "completion_note"
    t.datetime "created_at", null: false
    t.text "description"
    t.uuid "discrepancy_id"
    t.date "due_date"
    t.integer "priority", default: 1, null: false
    t.uuid "settlement_id"
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["assignee_id"], name: "index_todo_items_on_assignee_id"
    t.index ["assigner_id"], name: "index_todo_items_on_assigner_id"
    t.index ["discrepancy_id"], name: "index_todo_items_on_discrepancy_id"
    t.index ["due_date"], name: "index_todo_items_on_due_date"
    t.index ["priority"], name: "index_todo_items_on_priority"
    t.index ["settlement_id"], name: "index_todo_items_on_settlement_id"
    t.index ["status"], name: "index_todo_items_on_status"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.integer "city_id"
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.uuid "merchant_id"
    t.string "name", null: false
    t.string "phone", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["city_id"], name: "index_users_on_city_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["merchant_id"], name: "index_users_on_merchant_id"
    t.index ["phone"], name: "index_users_on_phone", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "amount_audit_logs", "settlements"
  add_foreign_key "amount_audit_logs", "users", column: "operator_id"
  add_foreign_key "approval_records", "approval_nodes"
  add_foreign_key "approval_records", "settlements"
  add_foreign_key "approval_records", "users", column: "approver_id"
  add_foreign_key "contract_attachments", "merchants"
  add_foreign_key "contract_attachments", "users", column: "uploader_id"
  add_foreign_key "delivery_orders", "merchants"
  add_foreign_key "delivery_orders", "users", column: "rider_id"
  add_foreign_key "discrepancies", "settlements"
  add_foreign_key "discrepancies", "users", column: "resolved_by"
  add_foreign_key "filter_configs", "users"
  add_foreign_key "settlement_items", "settlements"
  add_foreign_key "settlements", "merchants"
  add_foreign_key "settlements", "users", column: "handler_id"
  add_foreign_key "supplement_materials", "discrepancies"
  add_foreign_key "supplement_materials", "users", column: "uploader_id"
  add_foreign_key "todo_items", "discrepancies"
  add_foreign_key "todo_items", "settlements"
  add_foreign_key "todo_items", "users", column: "assignee_id"
  add_foreign_key "todo_items", "users", column: "assigner_id"
  add_foreign_key "users", "merchants"
end
