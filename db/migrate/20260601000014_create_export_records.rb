class CreateExportRecords < ActiveRecord::Migration[7.2]
  def change
    create_table :export_records do |t|
      t.references :operator, foreign_key: { to_table: :users }
      t.string :export_type, null: false
      t.jsonb :filter_conditions, default: {}
      t.string :file_url
      t.string :file_name
      t.string :status, default: "processing"
      t.datetime :generated_at
      t.text :error_message
      t.timestamps
    end
    add_index :export_records, :export_type
    add_index :export_records, :status
  end
end
