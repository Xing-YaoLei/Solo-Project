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

ActiveRecord::Schema[8.1].define(version: 2026_06_19_172008) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "channels", force: :cascade do |t|
    t.string "code", null: false
    t.decimal "commission_rate", precision: 5, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["code"], name: "index_channels_on_code", unique: true
    t.index ["status"], name: "index_channels_on_status"
  end

  create_table "check_in_records", force: :cascade do |t|
    t.datetime "actual_check_in_at"
    t.datetime "actual_check_out_at"
    t.datetime "created_at", null: false
    t.integer "guest_count", default: 1
    t.string "id_card_number"
    t.text "notes"
    t.bigint "order_id", null: false
    t.bigint "staff_id"
    t.datetime "updated_at", null: false
    t.index ["actual_check_in_at"], name: "index_check_in_records_on_actual_check_in_at"
    t.index ["order_id", "actual_check_in_at"], name: "index_check_in_records_on_order_id_and_actual_check_in_at"
    t.index ["order_id"], name: "index_check_in_records_on_order_id"
    t.index ["staff_id"], name: "index_check_in_records_on_staff_id"
  end

  create_table "orders", force: :cascade do |t|
    t.datetime "cancelled_at"
    t.bigint "channel_id", null: false
    t.decimal "channel_price", precision: 10, scale: 2
    t.date "check_in_date"
    t.date "check_out_date"
    t.datetime "confirmed_at"
    t.datetime "created_at", null: false
    t.string "customer_email"
    t.string "customer_name", null: false
    t.string "customer_phone"
    t.string "external_order_id"
    t.boolean "is_oversold", default: false, null: false
    t.text "notes"
    t.string "order_number", null: false
    t.bigint "package_id", null: false
    t.integer "quantity", default: 1, null: false
    t.bigint "staff_id"
    t.string "status", default: "pending", null: false
    t.decimal "total_amount", precision: 10, scale: 2, null: false
    t.decimal "unit_price", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["channel_id", "status"], name: "index_orders_on_channel_id_and_status"
    t.index ["channel_id"], name: "index_orders_on_channel_id"
    t.index ["check_in_date"], name: "index_orders_on_check_in_date"
    t.index ["external_order_id"], name: "index_orders_on_external_order_id"
    t.index ["is_oversold"], name: "index_orders_on_is_oversold"
    t.index ["order_number"], name: "index_orders_on_order_number", unique: true
    t.index ["package_id", "status"], name: "index_orders_on_package_id_and_status"
    t.index ["package_id"], name: "index_orders_on_package_id"
    t.index ["staff_id", "status"], name: "index_orders_on_staff_id_and_status"
    t.index ["staff_id"], name: "index_orders_on_staff_id"
    t.index ["status"], name: "index_orders_on_status"
  end

  create_table "oversell_communications", force: :cascade do |t|
    t.string "communication_type", default: "note"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.string "direction", null: false
    t.bigint "order_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["direction"], name: "index_oversell_communications_on_direction"
    t.index ["order_id", "created_at"], name: "index_oversell_communications_on_order_id_and_created_at"
    t.index ["order_id"], name: "index_oversell_communications_on_order_id"
    t.index ["user_id"], name: "index_oversell_communications_on_user_id"
  end

  create_table "oversell_reviews", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "order_id", null: false
    t.string "resolution", default: "pending", null: false
    t.text "review_opinion", null: false
    t.datetime "reviewed_at"
    t.bigint "reviewer_id"
    t.datetime "updated_at", null: false
    t.index ["order_id", "created_at"], name: "index_oversell_reviews_on_order_id_and_created_at"
    t.index ["order_id"], name: "index_oversell_reviews_on_order_id"
    t.index ["resolution"], name: "index_oversell_reviews_on_resolution"
    t.index ["reviewer_id"], name: "index_oversell_reviews_on_reviewer_id"
  end

  create_table "packages", force: :cascade do |t|
    t.integer "available_inventory", default: 0, null: false
    t.decimal "base_price", precision: 10, scale: 2, default: "0.0", null: false
    t.string "cover_image"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.integer "sold_count", default: 0, null: false
    t.string "status", default: "active", null: false
    t.integer "total_inventory", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["available_inventory"], name: "index_packages_on_available_inventory"
    t.index ["status"], name: "index_packages_on_status"
  end

  create_table "price_rules", force: :cascade do |t|
    t.bigint "channel_id"
    t.datetime "created_at", null: false
    t.date "end_date"
    t.integer "min_quantity", default: 1
    t.string "name", null: false
    t.bigint "package_id", null: false
    t.string "rule_type", null: false
    t.date "start_date"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.decimal "value", precision: 10, scale: 2, null: false
    t.index ["channel_id"], name: "index_price_rules_on_channel_id"
    t.index ["package_id", "channel_id"], name: "index_price_rules_on_package_id_and_channel_id"
    t.index ["package_id"], name: "index_price_rules_on_package_id"
    t.index ["status"], name: "index_price_rules_on_status"
  end

  create_table "redemption_records", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "notes"
    t.bigint "order_id", null: false
    t.datetime "redeemed_at"
    t.string "redemption_code", null: false
    t.bigint "staff_id"
    t.string "status", default: "pending", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_redemption_records_on_order_id"
    t.index ["redeemed_at"], name: "index_redemption_records_on_redeemed_at"
    t.index ["redemption_code"], name: "index_redemption_records_on_redemption_code", unique: true
    t.index ["staff_id"], name: "index_redemption_records_on_staff_id"
    t.index ["status"], name: "index_redemption_records_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "name"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "check_in_records", "orders"
  add_foreign_key "check_in_records", "users", column: "staff_id"
  add_foreign_key "orders", "channels"
  add_foreign_key "orders", "packages"
  add_foreign_key "orders", "users", column: "staff_id"
  add_foreign_key "oversell_communications", "orders"
  add_foreign_key "oversell_communications", "users"
  add_foreign_key "oversell_reviews", "orders"
  add_foreign_key "oversell_reviews", "users", column: "reviewer_id"
  add_foreign_key "price_rules", "channels"
  add_foreign_key "price_rules", "packages"
  add_foreign_key "redemption_records", "orders"
  add_foreign_key "redemption_records", "users", column: "staff_id"
end
