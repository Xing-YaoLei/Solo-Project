class CreateSettlementItems < ActiveRecord::Migration[8.1]
  def change
    create_table :settlement_items do |t|
      t.references :settlement, null: false, foreign_key: true
      t.references :order, null: false, foreign_key: true
      t.references :enrollment, null: false, foreign_key: true
      t.integer :item_type
      t.decimal :amount
      t.decimal :commission_amount
      t.integer :status

      t.timestamps
    end
  end
end
