class CreateParkingSpots < ActiveRecord::Migration[7.2]
  def change
    create_table :parking_spots do |t|
      t.string :spot_number, null: false
      t.string :zone, null: false
      t.string :spot_type, null: false, default: "regular"
      t.boolean :occupied, default: false
      t.string :floor
      t.decimal :monthly_rate, precision: 10, scale: 2, default: 0

      t.timestamps
    end

    add_index :parking_spots, :spot_number, unique: true
    add_index :parking_spots, :zone
  end
end
