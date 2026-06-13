class CreatePerformanceFeedbacks < ActiveRecord::Migration[7.2]
  def change
    create_table :performance_feedbacks do |t|
      t.references :course_consumption, null: false, foreign_key: true
      t.references :course_chapter, foreign_key: true
      t.integer :score
      t.string :performance_level
      t.text :coach_feedback
      t.text :member_feedback
      t.text :improvement_points
      t.string :body_metrics
      t.timestamps
    end
  end
end
