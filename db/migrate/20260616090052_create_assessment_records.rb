class CreateAssessmentRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :assessment_records do |t|
      t.references :patient, null: false, foreign_key: true
      t.references :scale, null: false, foreign_key: { to_table: :assessment_scales }
      t.references :assessor, null: false, foreign_key: { to_table: :users }
      t.decimal :total_score
      t.string :grade
      t.jsonb :item_scores
      t.date :assessed_at
      t.string :status, default: 'draft'

      t.timestamps
    end
  end
end
