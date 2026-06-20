class CreateCheckInRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :check_in_records do |t|
      t.references :ticket_order, null: false, foreign_key: true
      t.references :ticket_type, null: false, foreign_key: true
      t.references :event, null: false, foreign_key: true
      t.references :operator, null: false, foreign_key: { to_table: :users }
      t.datetime :check_in_time
      t.string :check_in_method
      t.text :note

      t.timestamps
    end
  end
end
