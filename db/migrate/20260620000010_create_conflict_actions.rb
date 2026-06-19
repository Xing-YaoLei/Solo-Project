class CreateConflictActions < ActiveRecord::Migration[8.1]
  def change
    create_table :conflict_actions do |t|
      t.references :room_conflict, null: false, foreign_key: true
      t.text :action
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.text :note

      t.timestamps
    end
  end
end
