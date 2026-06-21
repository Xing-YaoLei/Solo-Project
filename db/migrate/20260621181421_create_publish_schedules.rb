class CreatePublishSchedules < ActiveRecord::Migration[8.1]
  def change
    create_table :publish_schedules do |t|
      t.references :document, null: false, foreign_key: true
      t.datetime :planned_publish_at
      t.datetime :actual_publish_at
      t.string :channel
      t.text :note

      t.timestamps
    end
  end
end
