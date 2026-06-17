class CreateParkingBills < ActiveRecord::Migration[7.2]
  def change
    create_table :parking_bills do |t|
      t.string :bill_number
      t.references :parking_spot, null: false, foreign_key: true
      t.references :access_record, foreign_key: true
      t.string :plate_number, null: false
      t.string :bill_type, null: false, default: "hourly"
      t.string :status, null: false, default: "unpaid"
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.datetime :check_in_at
      t.datetime :check_out_at
      t.datetime :paid_at
      t.string :payment_method

      t.timestamps
    end

    add_index :parking_bills, :bill_number, unique: true
    add_index :parking_bills, :status
    add_index :parking_bills, :check_in_at
  end
end
