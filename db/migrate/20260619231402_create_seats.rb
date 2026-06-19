class CreateSeats < ActiveRecord::Migration[8.1]
  def change
    create_table :seats do |t|
      t.references :performance, null: false, foreign_key: true
      t.string :row
      t.string :seat_number
      t.string :section
      t.decimal :price
      t.string :status

      t.timestamps
    end
  end
end
