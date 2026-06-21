# frozen_string_literal: true

class CreateApprovalNodes < ActiveRecord::Migration[8.1]
  def change
    create_table :approval_nodes, id: :uuid do |t|
      t.string :name, null: false
      t.integer :order, default: 0
      t.string :approver_role
      t.decimal :threshold_amount, precision: 12, scale: 2
      t.uuid :parent_id
      t.jsonb :conditions, default: {}
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :approval_nodes, :order
    add_index :approval_nodes, :approver_role
    add_index :approval_nodes, :parent_id
    add_index :approval_nodes, :active
  end
end
