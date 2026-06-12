class AddMonthlyPurchaseToStores < ActiveRecord::Migration[8.0]
  def change
    add_column :stores, :monthly_purchase, :decimal, precision: 12, scale: 2, default: 100000.0
  end
end
