class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :orders do |t|
      t.references :user, null: false, foreign_key: true
      t.references :course, null: false, foreign_key: true
      t.references :channel, null: false, foreign_key: true
      t.string :order_no
      t.decimal :amount
      t.decimal :original_amount
      t.decimal :discount_amount
      t.integer :status
      t.integer :pay_method
      t.datetime :paid_at
      t.decimal :refund_amount
      t.datetime :refunded_at

      t.timestamps
    end
  end
end
