# frozen_string_literal: true

class CreateDiscrepancies < ActiveRecord::Migration[8.1]
  def change
    create_table :discrepancies, id: :uuid do |t|
      t.uuid :settlement_id, null: false
      t.decimal :difference_amount, precision: 12, scale: 2, default: 0.0
      t.text :reason
      t.integer :status, default: 0, null: false
      t.jsonb :comparison_data, default: {}

      t.timestamps
    end

    add_index :discrepancies, :settlement_id
    add_index :discrepancies, :status
    add_index :discrepancies, :created_at
    add_foreign_key :discrepancies, :settlements, column: :settlement_id
  end
end
