class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.string :order_no
      t.string :customer_name
      t.string :customer_phone
      t.string :customer_email
      t.decimal :total_amount
      t.string :status
      t.string :payment_method
      t.datetime :paid_at
      t.datetime :refunded_at
      t.text :notes

      t.timestamps
    end
  end
end
