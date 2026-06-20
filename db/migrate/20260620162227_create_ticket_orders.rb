class CreateTicketOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :ticket_orders do |t|
      t.references :event, null: false, foreign_key: true
      t.references :ticket_type, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :order_no
      t.string :buyer_name
      t.string :buyer_email
      t.string :buyer_phone
      t.integer :quantity
      t.decimal :total_amount
      t.string :status
      t.text :remark

      t.timestamps
    end
  end
end
