# frozen_string_literal: true

class CreateQuotes < ActiveRecord::Migration[8.1]
  def change
    create_table :quotes do |t|
      t.references :work_order, null: false, foreign_key: true
      t.string :quote_no
      t.string :status, default: 'draft'
      t.datetime :valid_until
      t.boolean :customer_approved, default: false
      t.datetime :approved_at
      t.bigint :approved_by_id
      t.decimal :total_amount, precision: 12, scale: 2
      t.bigint :created_by_id

      t.timestamps
    end

    add_index :quotes, :quote_no, unique: true
    add_index :quotes, :approved_by_id
    add_index :quotes, :created_by_id
  end
end
