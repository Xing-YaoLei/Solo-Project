class CreateExamRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :exam_records do |t|
      t.references :enrollment, null: false, foreign_key: true
      t.references :exam, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.decimal :score
      t.decimal :total_score
      t.boolean :is_passed
      t.datetime :start_time
      t.datetime :end_time
      t.integer :attempt_number
      t.integer :status

      t.timestamps
    end
  end
end
