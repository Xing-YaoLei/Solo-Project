class CreateRefundRecords < ActiveRecord::Migration[7.2]
  def change
    create_table :refund_records do |t|
      t.references :student, null: false, foreign_key: true
      t.references :member_profile, foreign_key: true
      t.references :operator, foreign_key: { to_table: :users }
      t.decimal :refund_amount, precision: 10, scale: 2
      t.string :refund_reason_code
      t.text :refund_reason
      t.string :refund_status, default: "pending"
      t.string :payment_method
      t.datetime :refunded_at
      t.text :approval_notes
      t.timestamps
    end
    add_index :refund_records, :refund_status
    add_index :refund_records, :refund_reason_code
  end
end
