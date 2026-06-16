class CreateEquipmentMaintenances < ActiveRecord::Migration[8.1]
  def change
    create_table :equipment_maintenances do |t|
      t.references :equipment, null: false, foreign_key: true
      t.string :maintenance_type
      t.text :description
      t.date :performed_at
      t.references :performer, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
