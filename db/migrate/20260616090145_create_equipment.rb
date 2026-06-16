class CreateEquipment < ActiveRecord::Migration[8.1]
  def change
    create_table :equipment do |t|
      t.string :name
      t.string :code
      t.string :category
      t.string :status, default: 'normal'
      t.references :area, null: false, foreign_key: true
      t.date :last_maintenance_date

      t.timestamps
    end
  end
end
