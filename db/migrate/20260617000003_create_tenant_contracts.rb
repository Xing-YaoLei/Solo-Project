class CreateTenantContracts < ActiveRecord::Migration[7.2]
  def change
    create_table :tenant_contracts do |t|
      t.string :contract_number, null: false
      t.references :tenant, null: false, foreign_key: true
      t.references :parking_spot, foreign_key: true
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.decimal :rent_amount, precision: 10, scale: 2, null: false
      t.string :status, default: "active"
      t.text :terms

      t.timestamps
    end

    add_index :tenant_contracts, :contract_number, unique: true
  end
end
