class CreateDowntimeActions < ActiveRecord::Migration[7.2]
  def change
    create_table :downtime_actions do |t|
      t.references :equipment_downtime, null: false, foreign_key: true
      t.text :action_description, null: false
      t.string :performed_by, null: false
      t.datetime :performed_at, null: false

      t.timestamps
    end
  end
end
