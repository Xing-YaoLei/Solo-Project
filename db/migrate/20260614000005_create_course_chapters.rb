class CreateCourseChapters < ActiveRecord::Migration[7.2]
  def change
    create_table :course_chapters do |t|
      t.references :course_consumption, null: false, foreign_key: true
      t.string :title, null: false
      t.text :content
      t.integer :position, default: 0
      t.string :chapter_status, default: "pending"
      t.datetime :completed_at
      t.timestamps
    end
    add_index :course_chapters, [:course_consumption_id, :position]
  end
end
