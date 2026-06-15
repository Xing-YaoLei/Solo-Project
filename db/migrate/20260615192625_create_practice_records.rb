class CreatePracticeRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :practice_records do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :question_bank, null: false, foreign_key: true
      t.references :question, null: false, foreign_key: true
      t.text :user_answer
      t.boolean :is_correct
      t.datetime :answered_at

      t.timestamps
    end
  end
end
