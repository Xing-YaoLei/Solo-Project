# frozen_string_literal: true

class CreateWorkOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :work_orders do |t|
      t.string :work_order_no
      t.string :customer_name
      t.string :customer_phone
      t.string :vehicle_brand
      t.string :vehicle_model
      t.string :vehicle_plate
      t.integer :vehicle_mileage
      t.string :status, default: 'pending'
      t.string :priority, default: 'normal'
      t.text :description
      t.decimal :total_amount, precision: 12, scale: 2
      t.boolean :is_repair, default: false
      t.bigint :parent_work_order_id
      t.bigint :assigned_to_id
      t.bigint :created_by_id
      t.datetime :completed_at
      t.references :user, null: false, foreign_key: true, type: :bigint

      t.timestamps
    end

    add_index :work_orders, :work_order_no, unique: true
    add_index :work_orders, :parent_work_order_id
    add_index :work_orders, :assigned_to_id
    add_index :work_orders, :created_by_id
  end
end
