class CreatePickupItems < ActiveRecord::Migration[7.2]
  def change
    create_table :pickup_items do |t|
      t.references :pickup_order, null: false, foreign_key: true
      t.string :product_name, null: false
      t.string :product_code
      t.string :product_tag, null: false
      t.integer :expected_quantity, null: false, default: 0
      t.integer :actual_quantity, default: 0
      t.integer :shortage_quantity, default: 0
      t.decimal :unit_price, precision: 10, scale: 2, default: 0
      t.decimal :total_amount, precision: 10, scale: 2, default: 0
      t.string :status, default: 'normal'
      t.text :remark

      t.timestamps
    end
    add_index :pickup_items, :product_tag
  end
end
