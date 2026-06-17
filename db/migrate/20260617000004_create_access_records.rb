class CreateAccessRecords < ActiveRecord::Migration[7.2]
  def change
    create_table :access_records do |t|
      t.string :plate_number, null: false
      t.string :direction, null: false
      t.string :access_type, null: false, default: "vehicle"
      t.datetime :accessed_at, null: false
      t.references :parking_spot, foreign_key: true
      t.string :gate_name
      t.string :image_url

      t.timestamps
    end

    add_index :access_records, :accessed_at
    add_index :access_records, :plate_number
  end
end
