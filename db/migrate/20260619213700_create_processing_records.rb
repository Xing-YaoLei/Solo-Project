class CreateProcessingRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :processing_records do |t|
      t.references :recordable, polymorphic: true, null: false
      t.references :handler, null: false, foreign_key: { to_table: :users }
      t.integer :status, default: 0
      t.string :action_type
      t.text :notes
      t.string :previous_status
      t.string :next_status

      t.timestamps
    end

    add_index :processing_records, :status
    add_index :processing_records, :created_at
  end
end
