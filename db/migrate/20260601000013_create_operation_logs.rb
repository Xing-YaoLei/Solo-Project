class CreateOperationLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :operation_logs do |t|
      t.references :operator, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.string :target_type
      t.bigint :target_id
      t.text :reason
      t.text :details
      t.jsonb :before_data, default: {}
      t.jsonb :after_data, default: {}
      t.string :ip_address
      t.string :user_agent
      t.string :status, default: "completed"
      t.datetime :closed_at
      t.timestamps
    end
    add_index :operation_logs, [:target_type, :target_id]
    add_index :operation_logs, :action
    add_index :operation_logs, :created_at
  end
end
