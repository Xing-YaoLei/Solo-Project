class CreateHeatPoints < ActiveRecord::Migration[8.1]
  def change
    create_table :heat_points do |t|
      t.string :name, null: false
      t.decimal :latitude, precision: 10, scale: 6
      t.decimal :longitude, precision: 10, scale: 6
      t.integer :heat_level, default: 1
      t.string :zone
      t.text :description
      t.integer :status, default: 0
      t.string :category

      t.timestamps
    end

    add_index :heat_points, :zone
    add_index :heat_points, :heat_level
    add_index :heat_points, :status
  end
end
