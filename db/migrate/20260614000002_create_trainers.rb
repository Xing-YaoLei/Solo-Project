class CreateTrainers < ActiveRecord::Migration[7.2]
  def change
    create_table :trainers do |t|
      t.string :name, null: false
      t.string :employee_no, null: false
      t.string :phone
      t.string :specialty
      t.boolean :active, default: true
      t.timestamps
    end
    add_index :trainers, :employee_no, unique: true
  end
end
