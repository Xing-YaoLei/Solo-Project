class CreateMerchantContracts < ActiveRecord::Migration[8.1]
  def change
    create_table :merchant_contracts do |t|
      t.string :merchant_name, null: false
      t.string :contract_number, null: false
      t.date :start_date
      t.date :end_date
      t.integer :amount_cents, default: 0
      t.decimal :commission_rate, precision: 5, scale: 2
      t.integer :status, default: 0
      t.string :category
      t.string :contact_person
      t.string :contact_phone
      t.text :terms
      t.string :shop_location

      t.timestamps
    end

    add_index :merchant_contracts, :contract_number, unique: true
    add_index :merchant_contracts, :status
    add_index :merchant_contracts, :category
    add_index :merchant_contracts, :merchant_name
  end
end
