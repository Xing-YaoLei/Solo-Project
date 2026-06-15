class CreateExamResults < ActiveRecord::Migration[7.2]
  def change
    create_table :exam_results do |t|
      t.references :exam, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.decimal :score, precision: 5, scale: 2
      t.boolean :passed, default: false
      t.integer :rank
      t.text :answer_sheet_url
      t.references :reviewer, foreign_key: { to_table: :users }
      t.datetime :reviewed_at
      t.text :remarks
      t.timestamps
    end
    add_index :exam_results, [:exam_id, :student_id], unique: true
    add_index :exam_results, :passed
  end
end
