class CreatePriceRules < ActiveRecord::Migration[8.1]
  def change
    create_table :price_rules do |t|
      t.references :package, null: false, foreign_key: true
      t.references :channel, foreign_key: true
      t.string :name, null: false
      t.string :rule_type, null: false
      t.decimal :value, precision: 10, scale: 2, null: false
      t.date :start_date
      t.date :end_date
      t.integer :min_quantity, default: 1
      t.string :status, null: false, default: "active"

      t.timestamps
    end

    add_index :price_rules, :status
    add_index :price_rules, [:package_id, :channel_id]
  end
end
