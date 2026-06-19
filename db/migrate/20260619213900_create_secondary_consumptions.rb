class CreateSecondaryConsumptions < ActiveRecord::Migration[8.1]
  def change
    create_table :secondary_consumptions do |t|
      t.references :merchant_contract, foreign_key: true
      t.integer :amount_cents, default: 0
      t.datetime :transaction_time
      t.integer :customer_count, default: 0
      t.string :source
      t.string :source_identifier
      t.string :transaction_no
      t.string :payment_method

      t.timestamps
    end

    add_index :secondary_consumptions, :transaction_time
    add_index :secondary_consumptions, :source
    add_index :secondary_consumptions, :transaction_no, unique: true
  end
end
