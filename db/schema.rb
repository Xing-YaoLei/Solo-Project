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

ActiveRecord::Schema[7.2].define(version: 2026_06_22_000016) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  # Custom types defined in this database.
  # Note that some types may not work with other database engines. Be careful if changing database.
  create_enum "audit_status", ["draft", "pending_materials", "in_progress", "pending_evidence", "pending_checklist", "pending_notification", "pending_approval", "approved", "rejected", "archived"]
  create_enum "exception_status", ["open", "assigned", "in_progress", "resolved", "closed"]
  create_enum "material_status", ["pending", "approved", "expired", "rejected"]
  create_enum "severity_level", ["low", "medium", "high", "critical"]
  create_enum "user_role", ["auditor", "supervisor", "admin"]

  create_table "audits", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "supplier_id", null: false
    t.uuid "creator_id", null: false
    t.uuid "template_id"
    t.string "title", limit: 200, null: false
    t.string "audit_type", limit: 50, null: false
    t.enum "status", default: "draft", null: false, enum_type: "audit_status"
    t.datetime "start_at"
    t.datetime "end_at"
    t.text "conclusion"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "notification_content"
    t.datetime "notification_generated_at"
    t.text "rejection_reason"
    t.index ["audit_type"], name: "index_audits_on_audit_type"
    t.index ["creator_id"], name: "index_audits_on_creator_id"
    t.index ["end_at"], name: "index_audits_on_end_at"
    t.index ["metadata"], name: "index_audits_on_metadata", using: :gin
    t.index ["notification_generated_at"], name: "index_audits_on_notification_generated_at"
    t.index ["start_at"], name: "index_audits_on_start_at"
    t.index ["status"], name: "index_audits_on_status"
    t.index ["supplier_id"], name: "index_audits_on_supplier_id"
    t.index ["template_id"], name: "index_audits_on_template_id"
  end

  create_table "checklist_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "audit_id", null: false
    t.string "item_code", limit: 50, null: false
    t.text "content", null: false
    t.string "status", limit: 20, default: "pending", null: false
    t.text "evidence_required"
    t.text "remark"
    t.integer "sort_order", default: 0
    t.uuid "checked_by_id"
    t.datetime "checked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["audit_id"], name: "index_checklist_items_on_audit_id"
    t.index ["checked_by_id"], name: "index_checklist_items_on_checked_by_id"
    t.index ["item_code"], name: "index_checklist_items_on_item_code"
    t.index ["sort_order"], name: "index_checklist_items_on_sort_order"
    t.index ["status"], name: "index_checklist_items_on_status"
  end

  create_table "evidence_attachments", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "audit_id", null: false
    t.uuid "uploader_id", null: false
    t.string "name", limit: 200, null: false
    t.string "file_type", limit: 100
    t.bigint "file_size"
    t.text "description"
    t.string "evidence_type", limit: 50
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["audit_id"], name: "index_evidence_attachments_on_audit_id"
    t.index ["evidence_type"], name: "index_evidence_attachments_on_evidence_type"
    t.index ["file_type"], name: "index_evidence_attachments_on_file_type"
    t.index ["uploader_id"], name: "index_evidence_attachments_on_uploader_id"
  end

  create_table "exception_orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "audit_id", null: false
    t.uuid "handler_id"
    t.string "title", limit: 200, null: false
    t.enum "severity", default: "medium", null: false, enum_type: "severity_level"
    t.enum "status", default: "open", null: false, enum_type: "exception_status"
    t.text "impact_scope"
    t.text "responsibility"
    t.text "conclusion"
    t.jsonb "missing_items", default: [], null: false
    t.datetime "resolved_at"
    t.datetime "due_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "auto_generated", default: false, null: false
    t.index ["audit_id"], name: "index_exception_orders_on_audit_id"
    t.index ["auto_generated"], name: "index_exception_orders_on_auto_generated"
    t.index ["due_at"], name: "index_exception_orders_on_due_at"
    t.index ["handler_id"], name: "index_exception_orders_on_handler_id"
    t.index ["missing_items"], name: "index_exception_orders_on_missing_items", using: :gin
    t.index ["resolved_at"], name: "index_exception_orders_on_resolved_at"
    t.index ["severity"], name: "index_exception_orders_on_severity"
    t.index ["status"], name: "index_exception_orders_on_status"
  end

  create_table "export_records", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.string "export_type", limit: 50, null: false
    t.jsonb "criteria", default: {}, null: false
    t.string "status", limit: 20, default: "pending", null: false
    t.string "file_url", limit: 500
    t.text "caliber_note"
    t.datetime "expired_at"
    t.bigint "file_size"
    t.string "file_name", limit: 255
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_export_records_on_created_at"
    t.index ["criteria"], name: "index_export_records_on_criteria", using: :gin
    t.index ["expired_at"], name: "index_export_records_on_expired_at"
    t.index ["export_type"], name: "index_export_records_on_export_type"
    t.index ["status"], name: "index_export_records_on_status"
    t.index ["user_id"], name: "index_export_records_on_user_id"
  end

  create_table "notification_templates", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "creator_id", null: false
    t.string "name", limit: 100, null: false
    t.string "audit_type", limit: 50, null: false
    t.text "content", null: false
    t.jsonb "variables", default: {}, null: false
    t.boolean "is_active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["audit_type"], name: "index_notification_templates_on_audit_type"
    t.index ["creator_id"], name: "index_notification_templates_on_creator_id"
    t.index ["is_active"], name: "index_notification_templates_on_is_active"
    t.index ["variables"], name: "index_notification_templates_on_variables", using: :gin
  end

  create_table "notifications", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "notifiable_id"
    t.string "notifiable_type", limit: 50
    t.string "notification_type", limit: 50, null: false
    t.string "title", limit: 200, null: false
    t.text "content"
    t.boolean "read", default: false, null: false
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_notifications_on_created_at"
    t.index ["notifiable_type", "notifiable_id"], name: "index_notifications_on_notifiable_type_and_notifiable_id"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["read"], name: "index_notifications_on_read"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "permission_configs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "supplier_id", null: false
    t.string "permission_type", limit: 50, null: false
    t.jsonb "access_scope", default: {}, null: false
    t.boolean "is_active", default: true, null: false
    t.uuid "granted_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["access_scope"], name: "index_permission_configs_on_access_scope", using: :gin
    t.index ["granted_by_id"], name: "index_permission_configs_on_granted_by_id"
    t.index ["is_active"], name: "index_permission_configs_on_is_active"
    t.index ["permission_type"], name: "index_permission_configs_on_permission_type"
    t.index ["supplier_id"], name: "index_permission_configs_on_supplier_id"
  end

  create_table "state_transition_logs", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "audit_id"
    t.uuid "exception_id"
    t.uuid "operator_id", null: false
    t.string "from_state", limit: 50
    t.string "to_state", limit: 50, null: false
    t.text "remark"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["audit_id"], name: "index_state_transition_logs_on_audit_id"
    t.index ["created_at"], name: "index_state_transition_logs_on_created_at"
    t.index ["exception_id"], name: "index_state_transition_logs_on_exception_id"
    t.index ["metadata"], name: "index_state_transition_logs_on_metadata", using: :gin
    t.index ["operator_id"], name: "index_state_transition_logs_on_operator_id"
    t.index ["to_state"], name: "index_state_transition_logs_on_to_state"
  end

  create_table "supplier_materials", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "supplier_id", null: false
    t.string "material_type", limit: 50, null: false
    t.string "name", limit: 200, null: false
    t.enum "status", default: "pending", null: false, enum_type: "material_status"
    t.datetime "expire_at"
    t.text "remark"
    t.uuid "uploaded_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expire_at"], name: "index_supplier_materials_on_expire_at"
    t.index ["material_type"], name: "index_supplier_materials_on_material_type"
    t.index ["status"], name: "index_supplier_materials_on_status"
    t.index ["supplier_id"], name: "index_supplier_materials_on_supplier_id"
    t.index ["uploaded_by_id"], name: "index_supplier_materials_on_uploaded_by_id"
  end

  create_table "suppliers", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", limit: 200, null: false
    t.string "code", limit: 50, null: false
    t.string "contact_person", limit: 100
    t.string "phone", limit: 50
    t.string "email", limit: 100
    t.string "status", limit: 20, default: "active", null: false
    t.text "description"
    t.uuid "created_by_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_suppliers_on_code", unique: true
    t.index ["created_by_id"], name: "index_suppliers_on_created_by_id"
    t.index ["name"], name: "index_suppliers_on_name"
    t.index ["status"], name: "index_suppliers_on_status"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", limit: 100, null: false
    t.string "email", limit: 100, null: false
    t.enum "role", default: "auditor", null: false, enum_type: "user_role"
    t.string "encrypted_password", limit: 255, null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.integer "failed_attempts", default: 0, null: false
    t.string "unlock_token"
    t.datetime "locked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["unlock_token"], name: "index_users_on_unlock_token", unique: true
  end

  create_table "versions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "item_type", null: false
    t.uuid "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object"
    t.datetime "created_at"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  add_foreign_key "audits", "notification_templates", column: "template_id"
  add_foreign_key "audits", "suppliers"
  add_foreign_key "audits", "users", column: "creator_id"
  add_foreign_key "checklist_items", "audits"
  add_foreign_key "checklist_items", "users", column: "checked_by_id"
  add_foreign_key "evidence_attachments", "audits"
  add_foreign_key "evidence_attachments", "users", column: "uploader_id"
  add_foreign_key "exception_orders", "audits"
  add_foreign_key "exception_orders", "users", column: "handler_id"
  add_foreign_key "export_records", "users"
  add_foreign_key "notification_templates", "users", column: "creator_id"
  add_foreign_key "notifications", "users"
  add_foreign_key "permission_configs", "suppliers"
  add_foreign_key "permission_configs", "users", column: "granted_by_id"
  add_foreign_key "state_transition_logs", "audits"
  add_foreign_key "state_transition_logs", "exception_orders", column: "exception_id"
  add_foreign_key "state_transition_logs", "users", column: "operator_id"
  add_foreign_key "supplier_materials", "suppliers"
  add_foreign_key "supplier_materials", "users", column: "uploaded_by_id"
  add_foreign_key "suppliers", "users", column: "created_by_id"
end
