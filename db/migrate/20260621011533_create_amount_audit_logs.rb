# frozen_string_literal: true

class CreateAmountAuditLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :amount_audit_logs, id: :uuid do |t|
      t.uuid :settlement_id, null: false
      t.uuid :operator_id, null: false
      t.decimal :old_amount, precision: 12, scale: 2, default: 0.0
      t.decimal :new_amount, precision: 12, scale: 2, default: 0.0
      t.text :change_reason
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :amount_audit_logs, :settlement_id
    add_index :amount_audit_logs, :operator_id
    add_foreign_key :amount_audit_logs, :settlements, column: :settlement_id
    add_foreign_key :amount_audit_logs, :users, column: :operator_id
  end
end
