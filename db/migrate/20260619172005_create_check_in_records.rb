class CreateCheckInRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :check_in_records do |t|
      t.references :order, null: false, foreign_key: true
      t.references :staff, foreign_key: { to_table: :users }

      t.datetime :actual_check_in_at
      t.datetime :actual_check_out_at
      t.integer :guest_count, default: 1
      t.string :id_card_number
      t.text :notes

      t.timestamps
    end

    add_index :check_in_records, :actual_check_in_at
    add_index :check_in_records, [:order_id, :actual_check_in_at]
  end
end
