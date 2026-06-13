class CreateActivityLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :activity_logs do |t|
      t.references :pickup_order, null: false, foreign_key: true
      t.references :user, foreign_key: true
      t.string :action, null: false
      t.string :from_status
      t.string :to_status
      t.text :details
      t.string :ip_address
      t.string :user_agent

      t.timestamps
    end
    add_index :activity_logs, :action
    add_index :activity_logs, :created_at
  end
end
