class CreateNotificationTemplates < ActiveRecord::Migration[7.2]
  def change
    create_table :notification_templates, id: :uuid do |t|
      t.uuid :creator_id, null: false
      t.string :name, null: false, limit: 100
      t.string :audit_type, null: false, limit: 50
      t.text :content, null: false
      t.jsonb :variables, null: false, default: {}
      t.boolean :is_active, null: false, default: true

      t.timestamps null: false

      t.index :audit_type
      t.index :is_active
      t.index :creator_id
      t.index :variables, using: :gin
    end

    add_foreign_key :notification_templates, :users, column: :creator_id
  end
end
