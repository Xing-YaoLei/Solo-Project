class CreateSettlementEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :settlement_events do |t|
      t.references :course_consumption, null: false, foreign_key: true
      t.string :event_type, null: false
      t.string :from_status
      t.string :to_status
      t.string :operator
      t.text :notes
      t.timestamps
    end
    add_index :settlement_events, [:course_consumption_id, :created_at]
    add_index :settlement_events, :event_type
  end
end
