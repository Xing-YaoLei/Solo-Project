class CreateNotes < ActiveRecord::Migration[8.1]
  def change
    create_table :notes do |t|
      t.references :work_order, null: false, foreign_key: true
      t.text :content
      t.bigint :author_id
      t.boolean :is_private, default: false

      t.timestamps
    end
  end
end
