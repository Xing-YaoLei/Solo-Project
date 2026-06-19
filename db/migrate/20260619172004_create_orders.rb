class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.string :order_number, null: false
      t.references :package, null: false, foreign_key: true
      t.references :channel, null: false, foreign_key: true
      t.references :staff, foreign_key: { to_table: :users }

      t.string :customer_name, null: false
      t.string :customer_phone
      t.string :customer_email

      t.integer :quantity, null: false, default: 1
      t.decimal :unit_price, precision: 10, scale: 2, null: false
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.decimal :channel_price, precision: 10, scale: 2

      t.date :check_in_date
      t.date :check_out_date

      t.string :status, null: false, default: "pending"
      t.boolean :is_oversold, default: false, null: false

      t.text :notes
      t.string :external_order_id

      t.datetime :confirmed_at
      t.datetime :cancelled_at

      t.timestamps
    end

    add_index :orders, :order_number, unique: true
    add_index :orders, :status
    add_index :orders, :is_oversold
    add_index :orders, :check_in_date
    add_index :orders, :external_order_id
    add_index :orders, [:package_id, :status]
    add_index :orders, [:channel_id, :status]
    add_index :orders, [:staff_id, :status]
  end
end
