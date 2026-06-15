class CreateExams < ActiveRecord::Migration[8.1]
  def change
    create_table :exams do |t|
      t.references :course, null: false, foreign_key: true
      t.string :title
      t.text :description
      t.references :question_bank, null: false, foreign_key: true
      t.integer :duration
      t.decimal :passing_score
      t.decimal :total_score
      t.integer :attempt_limit
      t.integer :status

      t.timestamps
    end
  end
end
