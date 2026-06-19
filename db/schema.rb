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

ActiveRecord::Schema[8.1].define(version: 2026_06_19_214100) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "exports", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "export_type", null: false
    t.jsonb "filters", default: {}
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["created_at"], name: "index_exports_on_created_at"
    t.index ["export_type"], name: "index_exports_on_export_type"
    t.index ["status"], name: "index_exports_on_status"
    t.index ["user_id"], name: "index_exports_on_user_id"
  end

  create_table "guide_contents", force: :cascade do |t|
    t.string "audio_url"
    t.string "category"
    t.text "content"
    t.string "cover_image"
    t.datetime "created_at", null: false
    t.integer "duration_minutes"
    t.integer "order_index", default: 0
    t.string "point_of_interest"
    t.integer "status", default: 0
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_guide_contents_on_category"
    t.index ["order_index"], name: "index_guide_contents_on_order_index"
    t.index ["status"], name: "index_guide_contents_on_status"
  end

  create_table "heat_points", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "heat_level", default: 1
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.string "name", null: false
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.string "zone"
    t.index ["heat_level"], name: "index_heat_points_on_heat_level"
    t.index ["status"], name: "index_heat_points_on_status"
    t.index ["zone"], name: "index_heat_points_on_zone"
  end

  create_table "merchant_contracts", force: :cascade do |t|
    t.integer "amount_cents", default: 0
    t.string "category"
    t.decimal "commission_rate", precision: 5, scale: 2
    t.string "contact_person"
    t.string "contact_phone"
    t.string "contract_number", null: false
    t.datetime "created_at", null: false
    t.date "end_date"
    t.string "merchant_name", null: false
    t.string "shop_location"
    t.date "start_date"
    t.integer "status", default: 0
    t.text "terms"
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_merchant_contracts_on_category"
    t.index ["contract_number"], name: "index_merchant_contracts_on_contract_number", unique: true
    t.index ["merchant_name"], name: "index_merchant_contracts_on_merchant_name"
    t.index ["status"], name: "index_merchant_contracts_on_status"
  end

  create_table "performance_cancellations", force: :cascade do |t|
    t.integer "affected_audience_count", default: 0
    t.integer "affected_merchant_count", default: 0
    t.datetime "created_at", null: false
    t.bigint "current_handler_id"
    t.bigint "performance_id", null: false
    t.text "reason"
    t.text "resolution_notes"
    t.datetime "resolved_at"
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.index ["current_handler_id"], name: "index_performance_cancellations_on_current_handler_id"
    t.index ["performance_id"], name: "index_performance_cancellations_on_performance_id"
    t.index ["status"], name: "index_performance_cancellations_on_status"
  end

  create_table "performance_seats", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "performance_id", null: false
    t.integer "price_cents", default: 0
    t.string "row_number"
    t.string "seat_number", null: false
    t.string "section"
    t.integer "status", default: 0
    t.string "ticket_holder_name"
    t.string "ticket_holder_phone"
    t.datetime "updated_at", null: false
    t.index ["performance_id", "seat_number"], name: "index_performance_seats_on_performance_id_and_seat_number", unique: true
    t.index ["performance_id"], name: "index_performance_seats_on_performance_id"
    t.index ["section"], name: "index_performance_seats_on_section"
    t.index ["status"], name: "index_performance_seats_on_status"
  end

  create_table "performances", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_time"
    t.string "name", null: false
    t.string "poster_image"
    t.datetime "start_time"
    t.integer "status", default: 0
    t.decimal "ticket_price", precision: 10, scale: 2
    t.integer "total_seats", default: 0
    t.datetime "updated_at", null: false
    t.string "venue"
    t.index ["start_time"], name: "index_performances_on_start_time"
    t.index ["status"], name: "index_performances_on_status"
    t.index ["venue"], name: "index_performances_on_venue"
  end

  create_table "processing_records", force: :cascade do |t|
    t.string "action_type"
    t.datetime "created_at", null: false
    t.bigint "handler_id", null: false
    t.string "next_status"
    t.text "notes"
    t.string "previous_status"
    t.bigint "recordable_id", null: false
    t.string "recordable_type", null: false
    t.integer "status", default: 0
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_processing_records_on_created_at"
    t.index ["handler_id"], name: "index_processing_records_on_handler_id"
    t.index ["recordable_type", "recordable_id"], name: "index_processing_records_on_recordable"
    t.index ["status"], name: "index_processing_records_on_status"
  end

  create_table "secondary_consumptions", force: :cascade do |t|
    t.integer "amount_cents", default: 0
    t.datetime "created_at", null: false
    t.integer "customer_count", default: 0
    t.bigint "merchant_contract_id"
    t.string "payment_method"
    t.string "source"
    t.string "source_identifier"
    t.string "transaction_no"
    t.datetime "transaction_time"
    t.datetime "updated_at", null: false
    t.index ["merchant_contract_id"], name: "index_secondary_consumptions_on_merchant_contract_id"
    t.index ["source"], name: "index_secondary_consumptions_on_source"
    t.index ["transaction_no"], name: "index_secondary_consumptions_on_transaction_no", unique: true
    t.index ["transaction_time"], name: "index_secondary_consumptions_on_transaction_time"
  end

  create_table "todos", force: :cascade do |t|
    t.bigint "assignee_id"
    t.datetime "created_at", null: false
    t.bigint "creator_id"
    t.text "description"
    t.date "due_date"
    t.integer "priority", default: 1
    t.bigint "source_id"
    t.string "source_type"
    t.integer "status", default: 0
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["assignee_id"], name: "index_todos_on_assignee_id"
    t.index ["creator_id"], name: "index_todos_on_creator_id"
    t.index ["due_date"], name: "index_todos_on_due_date"
    t.index ["priority"], name: "index_todos_on_priority"
    t.index ["source_type", "source_id"], name: "index_todos_on_source"
    t.index ["status"], name: "index_todos_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "department"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name", null: false
    t.string "phone"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "exports", "users"
  add_foreign_key "performance_cancellations", "performances"
  add_foreign_key "performance_cancellations", "users", column: "current_handler_id"
  add_foreign_key "performance_seats", "performances"
  add_foreign_key "processing_records", "users", column: "handler_id"
  add_foreign_key "secondary_consumptions", "merchant_contracts"
  add_foreign_key "todos", "users", column: "assignee_id"
  add_foreign_key "todos", "users", column: "creator_id"
end
