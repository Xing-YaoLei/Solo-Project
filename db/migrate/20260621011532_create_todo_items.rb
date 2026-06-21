# frozen_string_literal: true

class CreateTodoItems < ActiveRecord::Migration[8.1]
  def change
    create_table :todo_items, id: :uuid do |t|
      t.uuid :settlement_id
      t.uuid :discrepancy_id
      t.uuid :assignee_id, null: false
      t.uuid :assigner_id
      t.string :title, null: false
      t.text :description
      t.integer :priority, default: 1, null: false
      t.integer :status, default: 0, null: false
      t.date :due_date

      t.timestamps
    end

    add_index :todo_items, :settlement_id
    add_index :todo_items, :discrepancy_id
    add_index :todo_items, :assignee_id
    add_index :todo_items, :assigner_id
    add_index :todo_items, :status
    add_index :todo_items, :priority
    add_index :todo_items, :due_date
    add_foreign_key :todo_items, :settlements, column: :settlement_id
    add_foreign_key :todo_items, :discrepancies, column: :discrepancy_id
    add_foreign_key :todo_items, :users, column: :assignee_id
    add_foreign_key :todo_items, :users, column: :assigner_id
  end
end
