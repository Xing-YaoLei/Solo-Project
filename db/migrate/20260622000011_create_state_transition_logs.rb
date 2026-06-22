class CreateStateTransitionLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :state_transition_logs, id: :uuid do |t|
      t.uuid :audit_id
      t.uuid :exception_id
      t.uuid :operator_id, null: false
      t.string :from_state, limit: 50
      t.string :to_state, null: false, limit: 50
      t.text :remark
      t.jsonb :metadata, null: false, default: {}

      t.timestamps null: false

      t.index :audit_id
      t.index :exception_id
      t.index :operator_id
      t.index :created_at
      t.index :to_state
      t.index :metadata, using: :gin
    end

    add_foreign_key :state_transition_logs, :audits
    add_foreign_key :state_transition_logs, :exception_orders, column: :exception_id
    add_foreign_key :state_transition_logs, :users, column: :operator_id
  end
end
