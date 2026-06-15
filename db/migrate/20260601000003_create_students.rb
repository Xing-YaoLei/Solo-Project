class CreateStudents < ActiveRecord::Migration[7.2]
  def change
    create_table :students do |t|
      t.string :name, null: false
      t.string :phone
      t.string :email
      t.string :id_number
      t.date :birthday
      t.string :gender
      t.string :education
      t.string :occupation
      t.references :community, foreign_key: true
      t.string :status, default: "active"
      t.date :enrollment_date
      t.text :notes
      t.timestamps
    end
    add_index :students, :phone
    add_index :students, :status
  end
end
