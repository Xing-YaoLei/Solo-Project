class CreatePatients < ActiveRecord::Migration[8.1]
  def change
    create_table :patients do |t|
      t.string :name
      t.string :medical_record_no
      t.date :birth_date
      t.references :area, null: false, foreign_key: true

      t.timestamps
    end
  end
end
