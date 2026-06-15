class CreateChapters < ActiveRecord::Migration[8.1]
  def change
    create_table :chapters do |t|
      t.references :course, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.integer :position
      t.integer :status

      t.timestamps
    end
  end
end
