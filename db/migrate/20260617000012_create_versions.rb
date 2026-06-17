class CreateVersions < ActiveRecord::Migration[7.2]
  def change
    create_table :versions do |t|
      t.string :item_type, null: false
      t.bigint :item_id, null: false
      t.string :event, null: false
      t.string :whodunnit
      t.jsonb :object
      t.jsonb :object_changes
      t.integer :operator_id

      t.timestamps
    end

    add_index :versions, [:item_type, :item_id]
    add_index :versions, :operator_id
  end
end
