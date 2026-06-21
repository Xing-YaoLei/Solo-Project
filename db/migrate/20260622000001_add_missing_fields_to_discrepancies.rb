class AddMissingFieldsToDiscrepancies < ActiveRecord::Migration[8.1]
  def change
    add_column :discrepancies, :description, :text
    add_column :discrepancies, :resolution_type, :string
    add_column :discrepancies, :resolved_at, :datetime
    add_column :discrepancies, :resolved_by, :uuid
    add_column :discrepancies, :comment, :text

    add_index :discrepancies, :resolved_by
    add_foreign_key :discrepancies, :users, column: :resolved_by
  end
end
