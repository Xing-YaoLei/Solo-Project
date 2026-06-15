class CreateExams < ActiveRecord::Migration[7.2]
  def change
    create_table :exams do |t|
      t.string :name, null: false
      t.string :exam_type
      t.references :community, foreign_key: true
      t.date :exam_date
      t.integer :duration_minutes
      t.decimal :passing_score, precision: 5, scale: 2
      t.decimal :total_score, precision: 5, scale: 2
      t.text :description
      t.timestamps
    end
  end
end
