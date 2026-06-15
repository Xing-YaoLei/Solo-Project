class CreateLessonProgresses < ActiveRecord::Migration[8.1]
  def change
    create_table :lesson_progresses do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :lesson, null: false, foreign_key: true
      t.integer :status
      t.datetime :started_at
      t.datetime :completed_at
      t.integer :watch_duration

      t.timestamps
    end
  end
end
