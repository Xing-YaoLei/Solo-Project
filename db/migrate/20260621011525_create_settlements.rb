# frozen_string_literal: true

class CreateSettlements < ActiveRecord::Migration[8.1]
  def change
    create_table :settlements, id: :uuid do |t|
      t.uuid :merchant_id, null: false
      t.uuid :handler_id
      t.string :period, null: false
      t.decimal :system_amount, precision: 12, scale: 2, default: 0.0
      t.decimal :merchant_amount, precision: 12, scale: 2, default: 0.0
      t.decimal :difference_amount, precision: 12, scale: 2, default: 0.0
      t.integer :status, default: 0, null: false
      t.date :payment_date
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :settlements, [:merchant_id, :period], unique: true
    add_index :settlements, :status
    add_index :settlements, :payment_date
    add_index :settlements, :created_at
    add_index :settlements, :handler_id
    add_foreign_key :settlements, :merchants, column: :merchant_id
    add_foreign_key :settlements, :users, column: :handler_id
  end
end
