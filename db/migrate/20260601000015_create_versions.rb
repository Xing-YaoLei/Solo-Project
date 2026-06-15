class CreateVersions < ActiveRecord::Migration[7.2]
  def change
    create_table :versions do |t|
      t.string :item_type, null: false
      t.bigint :item_id, null: false
      t.string :event, null: false
      t.string :whodunnit
      t.text :object, limit: 1.megabyte
      t.text :object_changes, limit: 1.megabyte
      t.datetime :created_at
    end
    add_index :versions, %i[item_type item_id]
  end
end
