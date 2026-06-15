class CreateAssignmentSubmissions < ActiveRecord::Migration[7.2]
  def change
    create_table :assignment_submissions do |t|
      t.references :assignment, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.text :content
      t.string :attachment_url
      t.datetime :submitted_at
      t.datetime :last_modified_at
      t.string :status, default: "submitted"
      t.decimal :score, precision: 5, scale: 2
      t.float :plagiarism_score, default: 0.0
      t.jsonb :plagiarism_details, default: {}
      t.boolean :plagiarism_flagged, default: false
      t.text :feedback
      t.references :reviewer, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :assignment_submissions, [:assignment_id, :student_id], unique: true
    add_index :assignment_submissions, :plagiarism_flagged
  end
end
