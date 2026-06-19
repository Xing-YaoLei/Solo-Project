# frozen_string_literal: true

class CreateWorkOrderParts < ActiveRecord::Migration[8.1]
  def change
    create_table :work_order_parts do |t|
      t.references :work_order, null: false, foreign_key: true
      t.references :part, null: false, foreign_key: true
      t.integer :quantity, default: 1
      t.decimal :unit_price, precision: 10, scale: 2
      t.boolean :is_out_of_stock, default: false
      t.boolean :shortage_confirmed, default: false
      t.text :shortage_note
      t.bigint :shortage_handled_by_id
      t.datetime :shortage_handled_at

      t.timestamps
    end

    add_index :work_order_parts, :shortage_handled_by_id
  end
end
