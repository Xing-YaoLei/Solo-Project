class CreateCoursePackages < ActiveRecord::Migration[7.2]
  def change
    create_table :course_packages do |t|
      t.string :name, null: false
      t.string :package_type
      t.integer :total_sessions, null: false
      t.decimal :price, precision: 10, scale: 2
      t.integer :validity_days
      t.text :description
      t.timestamps
    end
  end
end
