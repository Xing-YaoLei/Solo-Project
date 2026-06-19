class CreateProperties < ActiveRecord::Migration[8.1]
  def change
    create_table :properties do |t|
      t.string :name
      t.string :address
      t.integer :room_count
      t.string :status
      t.references :manager, null: false, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :properties, :status
  end
end
