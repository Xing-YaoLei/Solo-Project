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

ActiveRecord::Schema[8.1].define(version: 2026_06_13_000003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "abnormal_reports", force: :cascade do |t|
    t.datetime "created_at", precision: nil
    t.text "handling_result"
    t.text "impact_scope"
    t.boolean "resolved", default: false
    t.datetime "resolved_at"
    t.text "responsibility_attribution"
    t.integer "severity", default: 0
    t.bigint "waste_report_id", null: false
    t.index ["waste_report_id"], name: "index_abnormal_reports_on_waste_report_id"
  end

  create_table "cost_entries", force: :cascade do |t|
    t.decimal "amount", precision: 12, scale: 2
    t.integer "cost_type", default: 0
    t.datetime "created_at", null: false
    t.text "note"
    t.bigint "responsible_store_id"
    t.datetime "updated_at", null: false
    t.bigint "waste_report_id", null: false
    t.index ["responsible_store_id"], name: "index_cost_entries_on_responsible_store_id"
    t.index ["waste_report_id"], name: "index_cost_entries_on_waste_report_id"
  end

  create_table "review_opinions", force: :cascade do |t|
    t.datetime "created_at", precision: nil
    t.text "opinion"
    t.integer "result", default: 0
    t.string "reviewer", null: false
    t.bigint "waste_report_id", null: false
    t.index ["waste_report_id"], name: "index_review_opinions_on_waste_report_id"
  end

  create_table "status_logs", force: :cascade do |t|
    t.datetime "created_at", precision: nil
    t.string "from_status"
    t.text "note"
    t.string "operator"
    t.string "to_status"
    t.bigint "waste_report_id", null: false
    t.index ["from_status"], name: "index_status_logs_on_from_status"
    t.index ["to_status"], name: "index_status_logs_on_to_status"
    t.index ["waste_report_id"], name: "index_status_logs_on_waste_report_id"
  end

  create_table "stores", force: :cascade do |t|
    t.boolean "active", default: true
    t.string "code", null: false
    t.datetime "created_at", null: false
    t.decimal "monthly_purchase", precision: 12, scale: 2, default: "100000.0"
    t.string "name", null: false
    t.string "region"
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_stores_on_code", unique: true
    t.index ["name"], name: "index_stores_on_name", unique: true
  end

  create_table "waste_items", force: :cascade do |t|
    t.string "category"
    t.datetime "created_at", null: false
    t.string "product_name", null: false
    t.string "product_sku"
    t.integer "quantity", null: false
    t.decimal "subtotal", precision: 12, scale: 2
    t.string "unit"
    t.decimal "unit_cost", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.string "waste_reason", null: false
    t.bigint "waste_report_id", null: false
    t.index ["waste_report_id"], name: "index_waste_items_on_waste_report_id"
  end

  create_table "waste_reports", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "notes"
    t.date "report_date", null: false
    t.string "reporter", null: false
    t.integer "status", default: 0
    t.bigint "store_id", null: false
    t.decimal "total_cost", precision: 12, scale: 2, default: "0.0"
    t.datetime "updated_at", null: false
    t.decimal "waste_rate", precision: 5, scale: 2, default: "0.0"
    t.index ["store_id"], name: "index_waste_reports_on_store_id"
  end

  add_foreign_key "abnormal_reports", "waste_reports"
  add_foreign_key "cost_entries", "stores", column: "responsible_store_id"
  add_foreign_key "cost_entries", "waste_reports"
  add_foreign_key "review_opinions", "waste_reports"
  add_foreign_key "status_logs", "waste_reports"
  add_foreign_key "waste_items", "waste_reports"
  add_foreign_key "waste_reports", "stores"
end
