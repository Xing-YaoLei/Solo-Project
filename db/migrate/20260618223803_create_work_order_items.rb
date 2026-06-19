# frozen_string_literal: true

class CreateWorkOrderItems < ActiveRecord::Migration[8.1]
  def change
    create_table :work_order_items do |t|
      t.references :work_order, null: false, foreign_key: true
      t.string :name
      t.text :description
      t.integer :quantity, default: 1
      t.decimal :unit_price, precision: 10, scale: 2
      t.decimal :labor_fee, precision: 10, scale: 2, default: 0
      t.bigint :technician_id
      t.string :status, default: 'pending'

      t.timestamps
    end

    add_index :work_order_items, :technician_id
  end
end
