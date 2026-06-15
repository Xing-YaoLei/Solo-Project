class CreateCourses < ActiveRecord::Migration[8.1]
  def change
    create_table :courses do |t|
      t.string :title
      t.string :subtitle
      t.text :description
      t.string :cover_url
      t.decimal :price
      t.decimal :original_price
      t.references :channel, null: false, foreign_key: true
      t.references :teacher, null: false, foreign_key: { to_table: :users }
      t.integer :status
      t.integer :duration
      t.integer :total_lessons
      t.integer :total_exams

      t.timestamps
    end
  end
end
