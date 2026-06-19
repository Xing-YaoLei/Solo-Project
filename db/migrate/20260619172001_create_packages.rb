class CreatePackages < ActiveRecord::Migration[8.1]
  def change
    create_table :packages do |t|
      t.string :name, null: false
      t.text :description
      t.decimal :base_price, precision: 10, scale: 2, null: false, default: 0
      t.integer :total_inventory, null: false, default: 0
      t.integer :available_inventory, null: false, default: 0
      t.integer :sold_count, null: false, default: 0
      t.string :status, null: false, default: "active"
      t.string :cover_image

      t.timestamps
    end

    add_index :packages, :status
    add_index :packages, :available_inventory
  end
end
