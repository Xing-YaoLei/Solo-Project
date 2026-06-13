class CreatePickupOrders < ActiveRecord::Migration[7.2]
  def change
    create_table :pickup_orders do |t|
      t.string :pickup_code, null: false
      t.string :customer_name, null: false
      t.string :customer_phone
      t.string :source, null: false
      t.string :status, default: 'pending'
      t.string :sub_status
      t.datetime :submitted_at
      t.datetime :processed_at
      t.datetime :reviewed_at
      t.datetime :closed_at
      t.datetime :fulfillment_time
      t.datetime :estimated_pickup_time
      t.datetime :actual_pickup_time
      t.references :operator, foreign_key: { to_table: :users }
      t.references :reviewer, foreign_key: { to_table: :users }
      t.text :notes
      t.boolean :has_shortage, default: false
      t.string :abnormal_reason

      t.timestamps
    end
    add_index :pickup_orders, :pickup_code, unique: true
    add_index :pickup_orders, :status
    add_index :pickup_orders, :source
    add_index :pickup_orders, :created_at
  end
end
