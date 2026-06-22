class CreatePermissionConfigs < ActiveRecord::Migration[7.2]
  def change
    create_table :permission_configs, id: :uuid do |t|
      t.uuid :supplier_id, null: false
      t.string :permission_type, null: false, limit: 50
      t.jsonb :access_scope, null: false, default: {}
      t.boolean :is_active, null: false, default: true
      t.uuid :granted_by_id

      t.timestamps null: false

      t.index :supplier_id
      t.index :permission_type
      t.index :is_active
      t.index :granted_by_id
      t.index :access_scope, using: :gin
    end

    add_foreign_key :permission_configs, :suppliers
    add_foreign_key :permission_configs, :users, column: :granted_by_id
  end
end
