class CreateRoomConflicts < ActiveRecord::Migration[8.1]
  def change
    create_table :room_conflicts do |t|
      t.references :property, null: false, foreign_key: true
      t.date :conflict_date
      t.string :status
      t.text :reason
      t.references :handler, null: true, foreign_key: { to_table: :users }
      t.datetime :closed_at

      t.timestamps
    end
    add_index :room_conflicts, :status
  end
end
