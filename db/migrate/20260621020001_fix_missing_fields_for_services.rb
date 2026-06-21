class FixMissingFieldsForServices < ActiveRecord::Migration[8.1]
  def change
    add_column :amount_audit_logs, :change_type, :string
    add_index :amount_audit_logs, :change_type

    add_column :todo_items, :completed_at, :datetime
    add_column :todo_items, :completion_note, :text
  end
end
