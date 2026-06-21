class CreateEvidenceAttachments < ActiveRecord::Migration[8.1]
  def change
    create_table :evidence_attachments do |t|
      t.references :legal_case, null: false, foreign_key: true
      t.string :name
      t.string :category
      t.text :description
      t.string :uploaded_by
      t.integer :page_count
      t.boolean :is_missing
      t.text :missing_notes

      t.timestamps
    end
  end
end
