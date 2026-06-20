class CreateRefundDisputes < ActiveRecord::Migration[8.1]
  def change
    create_table :refund_disputes do |t|
      t.references :ticket_order, null: false, foreign_key: true
      t.string :reporter_name
      t.string :reporter_phone
      t.text :reason
      t.string :status
      t.references :handler, null: false, foreign_key: { to_table: :users }
      t.datetime :closed_at

      t.timestamps
    end
  end
end
