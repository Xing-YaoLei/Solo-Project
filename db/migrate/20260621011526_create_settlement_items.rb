# frozen_string_literal: true

class CreateSettlementItems < ActiveRecord::Migration[8.1]
  def change
    create_table :settlement_items, id: :uuid do |t|
      t.uuid :settlement_id, null: false
      t.uuid :delivery_order_id
      t.decimal :amount, precision: 12, scale: 2, default: 0.0
      t.string :item_type
      t.jsonb :details, default: {}

      t.timestamps
    end

    add_index :settlement_items, :settlement_id
    add_index :settlement_items, :delivery_order_id
    add_index :settlement_items, :item_type
    add_foreign_key :settlement_items, :settlements, column: :settlement_id
  end
end
