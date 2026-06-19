class CreateExports < ActiveRecord::Migration[8.1]
  def change
    create_table :exports do |t|
      t.references :user, null: false, foreign_key: true
      t.string :export_type, null: false
      t.integer :status, default: 0
      t.jsonb :filters, default: {}

      t.timestamps
    end

    add_index :exports, :export_type
    add_index :exports, :status
    add_index :exports, :created_at
  end
end
