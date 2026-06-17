class CreateEquipmentDowntimes < ActiveRecord::Migration[7.2]
  def change
    create_table :equipment_downtimes do |t|
      t.string :equipment_name, null: false
      t.string :equipment_type, null: false
      t.string :reason, null: false
      t.text :description
      t.datetime :started_at, null: false
      t.datetime :closed_at
      t.string :status, null: false, default: "active"
      t.string :resolved_by
      t.text :action_taken

      t.timestamps
    end

    add_index :equipment_downtimes, :status
    add_index :equipment_downtimes, :started_at
  end
end
