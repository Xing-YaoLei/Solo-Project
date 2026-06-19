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

ActiveRecord::Schema[8.1].define(version: 2026_06_19_234432) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "checkin_codes", force: :cascade do |t|
    t.string "code"
    t.datetime "created_at", null: false
    t.datetime "expires_at"
    t.text "qr_code_data"
    t.string "status"
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.datetime "used_at"
    t.datetime "verified_at"
    t.index ["ticket_id"], name: "index_checkin_codes_on_ticket_id"
  end

  create_table "exception_records", force: :cascade do |t|
    t.string "assignee"
    t.datetime "closed_at"
    t.text "conclusion"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "exception_type"
    t.text "impact_scope"
    t.bigint "order_id", null: false
    t.text "resolution"
    t.string "responsible_person"
    t.string "status"
    t.bigint "ticket_id"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_exception_records_on_order_id"
    t.index ["ticket_id"], name: "index_exception_records_on_ticket_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "customer_email"
    t.string "customer_name"
    t.string "customer_phone"
    t.text "notes"
    t.string "order_no"
    t.datetime "paid_at"
    t.string "payment_method"
    t.datetime "refunded_at"
    t.string "status"
    t.decimal "total_amount"
    t.datetime "updated_at", null: false
  end

  create_table "performances", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.datetime "end_time"
    t.string "name"
    t.datetime "start_time"
    t.string "status"
    t.integer "total_seats"
    t.datetime "updated_at", null: false
    t.string "venue"
  end

  create_table "seats", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "performance_id", null: false
    t.decimal "price"
    t.string "row"
    t.string "seat_number"
    t.string "section"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["performance_id"], name: "index_seats_on_performance_id"
  end

  create_table "sponsors", force: :cascade do |t|
    t.string "address"
    t.string "contact_email"
    t.string "contact_person"
    t.string "contact_phone"
    t.datetime "created_at", null: false
    t.string "name"
    t.string "status"
    t.datetime "updated_at", null: false
  end

  create_table "sponsorships", force: :cascade do |t|
    t.decimal "amount"
    t.text "benefits"
    t.datetime "created_at", null: false
    t.date "end_date"
    t.bigint "performance_id", null: false
    t.bigint "sponsor_id", null: false
    t.string "sponsorship_type"
    t.date "start_date"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["performance_id"], name: "index_sponsorships_on_performance_id"
    t.index ["sponsor_id"], name: "index_sponsorships_on_sponsor_id"
  end

  create_table "status_logs", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "event"
    t.string "from_state"
    t.text "metadata"
    t.string "operator"
    t.text "reason"
    t.string "to_state"
    t.bigint "trackable_id", null: false
    t.string "trackable_type", null: false
    t.datetime "updated_at", null: false
    t.index ["trackable_type", "trackable_id"], name: "index_status_logs_on_trackable"
  end

  create_table "ticket_types", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "max_quantity"
    t.integer "min_quantity"
    t.string "name"
    t.bigint "performance_id", null: false
    t.decimal "price"
    t.string "refund_policy"
    t.datetime "sale_end_time"
    t.datetime "sale_start_time"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["performance_id"], name: "index_ticket_types_on_performance_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.datetime "checked_in_at"
    t.datetime "created_at", null: false
    t.bigint "order_id", null: false
    t.bigint "seat_id", null: false
    t.string "status"
    t.string "ticket_no"
    t.bigint "ticket_type_id", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_tickets_on_order_id"
    t.index ["seat_id"], name: "index_tickets_on_seat_id"
    t.index ["ticket_type_id"], name: "index_tickets_on_ticket_type_id"
  end

  add_foreign_key "checkin_codes", "tickets"
  add_foreign_key "exception_records", "orders"
  add_foreign_key "exception_records", "tickets", on_delete: :nullify
  add_foreign_key "seats", "performances"
  add_foreign_key "sponsorships", "performances"
  add_foreign_key "sponsorships", "sponsors"
  add_foreign_key "ticket_types", "performances"
  add_foreign_key "tickets", "orders"
  add_foreign_key "tickets", "seats"
  add_foreign_key "tickets", "ticket_types"
end
