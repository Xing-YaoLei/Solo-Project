# frozen_string_literal: true

class CreateDeliveryOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :delivery_orders, id: :uuid do |t|
      t.uuid :rider_id
      t.uuid :merchant_id, null: false
      t.string :order_no, null: false
      t.decimal :amount, precision: 12, scale: 2, default: 0.0
      t.integer :status, default: 0, null: false
      t.datetime :delivery_time

      t.timestamps
    end

    add_index :delivery_orders, :rider_id
    add_index :delivery_orders, :merchant_id
    add_index :delivery_orders, :order_no, unique: true
    add_index :delivery_orders, :status
    add_index :delivery_orders, :delivery_time
    add_foreign_key :delivery_orders, :users, column: :rider_id
    add_foreign_key :delivery_orders, :merchants, column: :merchant_id
  end
end
