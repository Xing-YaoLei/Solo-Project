class CreateAudits < ActiveRecord::Migration[7.2]
  def change
    create_table :audits, id: :uuid do |t|
      t.uuid :supplier_id, null: false
      t.uuid :creator_id, null: false
      t.uuid :template_id
      t.string :title, null: false, limit: 200
      t.string :audit_type, null: false, limit: 50
      t.enum :status, enum_type: :audit_status, default: "draft", null: false
      t.datetime :start_at
      t.datetime :end_at
      t.text :conclusion
      t.jsonb :metadata, null: false, default: {}

      t.timestamps null: false

      t.index :supplier_id
      t.index :status
      t.index :creator_id
      t.index :template_id
      t.index :audit_type
      t.index :start_at
      t.index :end_at
      t.index :metadata, using: :gin
    end

    add_foreign_key :audits, :suppliers
    add_foreign_key :audits, :users, column: :creator_id
    add_foreign_key :audits, :notification_templates, column: :template_id
  end
end
