class CreatePerformanceSeats < ActiveRecord::Migration[8.1]
  def change
    create_table :performance_seats do |t|
      t.references :performance, null: false, foreign_key: true
      t.string :seat_number, null: false
      t.string :section
      t.string :row_number
      t.integer :price_cents, default: 0
      t.integer :status, default: 0
      t.string :ticket_holder_name
      t.string :ticket_holder_phone

      t.timestamps
    end

    add_index :performance_seats, [:performance_id, :seat_number], unique: true
    add_index :performance_seats, :status
    add_index :performance_seats, :section
  end
end
