# frozen_string_literal: true

class CreateQuoteItems < ActiveRecord::Migration[8.1]
  def change
    create_table :quote_items do |t|
      t.references :quote, null: false, foreign_key: true
      t.string :name
      t.text :description
      t.string :item_type
      t.integer :quantity, default: 1
      t.decimal :unit_price, precision: 10, scale: 2
      t.decimal :discount_rate, precision: 5, scale: 2, default: 0

      t.timestamps
    end
  end
end
