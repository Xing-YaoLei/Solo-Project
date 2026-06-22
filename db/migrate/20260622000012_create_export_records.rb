class CreateExportRecords < ActiveRecord::Migration[7.2]
  def change
    create_table :export_records, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.string :export_type, null: false, limit: 50
      t.jsonb :criteria, null: false, default: {}
      t.string :status, null: false, default: "pending", limit: 20
      t.string :file_url, limit: 500
      t.text :caliber_note
      t.datetime :expired_at
      t.bigint :file_size
      t.string :file_name, limit: 255

      t.timestamps null: false

      t.index :user_id
      t.index :status
      t.index :export_type
      t.index :created_at
      t.index :expired_at
      t.index :criteria, using: :gin
    end

    add_foreign_key :export_records, :users
  end
end
