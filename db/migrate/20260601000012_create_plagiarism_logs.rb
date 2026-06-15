class CreatePlagiarismLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :plagiarism_logs do |t|
      t.references :assignment_submission, null: false, foreign_key: true
      t.references :student, null: false, foreign_key: true
      t.references :assignment, foreign_key: true
      t.references :source_submission, foreign_key: { to_table: :assignment_submissions }
      t.float :similarity_score
      t.text :reason
      t.jsonb :similar_segments, default: {}
      t.string :status, default: "open"
      t.references :responsible_user, foreign_key: { to_table: :users }
      t.datetime :notified_at
      t.datetime :resolved_at
      t.datetime :closed_at
      t.string :action_taken
      t.text :resolution_notes
      t.references :handler, foreign_key: { to_table: :users }
      t.timestamps
    end
    add_index :plagiarism_logs, :status
  end
end
