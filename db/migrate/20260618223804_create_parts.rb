# frozen_string_literal: true

class CreateParts < ActiveRecord::Migration[8.1]
  def change
    create_table :parts do |t|
      t.string :sku
      t.string :name
      t.string :category
      t.string :brand
      t.string :specification
      t.string :unit
      t.integer :stock_quantity, default: 0
      t.integer :safety_stock, default: 0
      t.decimal :cost_price, precision: 10, scale: 2
      t.decimal :selling_price, precision: 10, scale: 2
      t.string :location

      t.timestamps
    end

    add_index :parts, :sku, unique: true
  end
end
