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

ActiveRecord::Schema[8.1].define(version: 2026_06_20_000012) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "channel_orders", force: :cascade do |t|
    t.string "channel"
    t.date "check_in"
    t.date "check_out"
    t.datetime "created_at", null: false
    t.integer "guest_count"
    t.bigint "guest_id", null: false
    t.string "order_no"
    t.decimal "price"
    t.bigint "property_id", null: false
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["guest_id"], name: "index_channel_orders_on_guest_id"
    t.index ["order_no"], name: "index_channel_orders_on_order_no"
    t.index ["property_id"], name: "index_channel_orders_on_property_id"
    t.index ["status"], name: "index_channel_orders_on_status"
  end

  create_table "check_in_documents", force: :cascade do |t|
    t.bigint "channel_order_id", null: false
    t.datetime "created_at", null: false
    t.string "gender"
    t.bigint "guest_id", null: false
    t.string "id_number"
    t.string "id_type"
    t.string "name"
    t.string "nationality"
    t.datetime "updated_at", null: false
    t.index ["channel_order_id"], name: "index_check_in_documents_on_channel_order_id"
    t.index ["guest_id"], name: "index_check_in_documents_on_guest_id"
  end

  create_table "cleaning_tasks", force: :cascade do |t|
    t.bigint "assignee_id"
    t.datetime "created_at", null: false
    t.text "note"
    t.string "priority"
    t.bigint "property_id", null: false
    t.string "status"
    t.date "task_date"
    t.datetime "updated_at", null: false
    t.index ["assignee_id"], name: "index_cleaning_tasks_on_assignee_id"
    t.index ["property_id"], name: "index_cleaning_tasks_on_property_id"
    t.index ["status"], name: "index_cleaning_tasks_on_status"
  end

  create_table "conflict_actions", force: :cascade do |t|
    t.text "action"
    t.bigint "actor_id", null: false
    t.datetime "created_at", null: false
    t.text "note"
    t.bigint "room_conflict_id", null: false
    t.datetime "updated_at", null: false
    t.index ["actor_id"], name: "index_conflict_actions_on_actor_id"
    t.index ["room_conflict_id"], name: "index_conflict_actions_on_room_conflict_id"
  end

  create_table "document_change_logs", force: :cascade do |t|
    t.string "changed_field"
    t.bigint "check_in_document_id", null: false
    t.datetime "created_at", null: false
    t.string "new_value"
    t.string "old_value"
    t.bigint "operator_id", null: false
    t.datetime "updated_at", null: false
    t.index ["check_in_document_id"], name: "index_document_change_logs_on_check_in_document_id"
    t.index ["operator_id"], name: "index_document_change_logs_on_operator_id"
  end

  create_table "guests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "id_number"
    t.string "name"
    t.string "phone"
    t.datetime "updated_at", null: false
    t.index ["id_number"], name: "index_guests_on_id_number"
  end

  create_table "monthly_reports", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.decimal "occupancy_rate"
    t.integer "occupied_rooms"
    t.bigint "property_id", null: false
    t.date "report_month"
    t.decimal "total_revenue"
    t.integer "total_rooms"
    t.datetime "updated_at", null: false
    t.index ["property_id"], name: "index_monthly_reports_on_property_id"
    t.index ["report_month"], name: "index_monthly_reports_on_report_month"
  end

  create_table "properties", force: :cascade do |t|
    t.string "address"
    t.datetime "created_at", null: false
    t.bigint "manager_id", null: false
    t.string "name"
    t.integer "room_count"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["manager_id"], name: "index_properties_on_manager_id"
    t.index ["status"], name: "index_properties_on_status"
  end

  create_table "report_downloads", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "file_name"
    t.jsonb "filters"
    t.datetime "generated_at"
    t.string "report_type"
    t.bigint "reporter_id", null: false
    t.datetime "updated_at", null: false
    t.index ["reporter_id"], name: "index_report_downloads_on_reporter_id"
  end

  create_table "room_conflicts", force: :cascade do |t|
    t.datetime "closed_at"
    t.date "conflict_date"
    t.datetime "created_at", null: false
    t.bigint "handler_id"
    t.bigint "property_id", null: false
    t.text "reason"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["handler_id"], name: "index_room_conflicts_on_handler_id"
    t.index ["property_id"], name: "index_room_conflicts_on_property_id"
    t.index ["status"], name: "index_room_conflicts_on_status"
  end

  create_table "room_statuses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "note"
    t.bigint "property_id", null: false
    t.string "status"
    t.date "status_date"
    t.datetime "updated_at", null: false
    t.index ["property_id"], name: "index_room_statuses_on_property_id"
    t.index ["status"], name: "index_room_statuses_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "phone"
    t.string "role"
    t.datetime "updated_at", null: false
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "channel_orders", "guests"
  add_foreign_key "channel_orders", "properties"
  add_foreign_key "check_in_documents", "channel_orders"
  add_foreign_key "check_in_documents", "guests"
  add_foreign_key "cleaning_tasks", "properties"
  add_foreign_key "cleaning_tasks", "users", column: "assignee_id"
  add_foreign_key "conflict_actions", "room_conflicts"
  add_foreign_key "conflict_actions", "users", column: "actor_id"
  add_foreign_key "document_change_logs", "check_in_documents"
  add_foreign_key "document_change_logs", "users", column: "operator_id"
  add_foreign_key "monthly_reports", "properties"
  add_foreign_key "properties", "users", column: "manager_id"
  add_foreign_key "report_downloads", "users", column: "reporter_id"
  add_foreign_key "room_conflicts", "properties"
  add_foreign_key "room_conflicts", "users", column: "handler_id"
  add_foreign_key "room_statuses", "properties"
end
