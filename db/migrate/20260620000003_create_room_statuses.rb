class CreateRoomStatuses < ActiveRecord::Migration[8.1]
  def change
    create_table :room_statuses do |t|
      t.references :property, null: false, foreign_key: true
      t.date :status_date
      t.string :status
      t.string :note

      t.timestamps
    end
    add_index :room_statuses, :status
  end
end
