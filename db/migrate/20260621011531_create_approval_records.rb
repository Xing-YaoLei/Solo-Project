# frozen_string_literal: true

class CreateApprovalRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :approval_records, id: :uuid do |t|
      t.uuid :settlement_id, null: false
      t.uuid :approval_node_id, null: false
      t.uuid :approver_id, null: false
      t.integer :decision, default: 0, null: false
      t.text :comment

      t.timestamps
    end

    add_index :approval_records, :settlement_id
    add_index :approval_records, :approval_node_id
    add_index :approval_records, :approver_id
    add_index :approval_records, :decision
    add_foreign_key :approval_records, :settlements, column: :settlement_id
    add_foreign_key :approval_records, :approval_nodes, column: :approval_node_id
    add_foreign_key :approval_records, :users, column: :approver_id
  end
end
