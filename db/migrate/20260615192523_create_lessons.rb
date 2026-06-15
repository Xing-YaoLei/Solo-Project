class CreateLessons < ActiveRecord::Migration[8.1]
  def change
    create_table :lessons do |t|
      t.references :chapter, null: false, foreign_key: true
      t.string :title
      t.text :content
      t.integer :lesson_type
      t.string :video_url
      t.integer :duration
      t.integer :position
      t.integer :status

      t.timestamps
    end
  end
end
