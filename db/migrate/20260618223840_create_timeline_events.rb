class CreateTimelineEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :timeline_events do |t|
      t.references :work_order, null: false, foreign_key: true
      t.string :event_type
      t.text :content
      t.jsonb :metadata, default: {}
      t.bigint :user_id

      t.timestamps
    end
  end
end
