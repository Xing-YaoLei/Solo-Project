class CreateEvidenceAttachments < ActiveRecord::Migration[7.2]
  def change
    create_table :evidence_attachments, id: :uuid do |t|
      t.uuid :audit_id, null: false
      t.uuid :uploader_id, null: false
      t.string :name, null: false, limit: 200
      t.string :file_type, limit: 100
      t.bigint :file_size
      t.text :description
      t.string :evidence_type, limit: 50

      t.timestamps null: false

      t.index :audit_id
      t.index :uploader_id
      t.index :file_type
      t.index :evidence_type
    end

    add_foreign_key :evidence_attachments, :audits
    add_foreign_key :evidence_attachments, :users, column: :uploader_id
  end
end
