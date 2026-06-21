class AddMissingFieldsToSettlements < ActiveRecord::Migration[8.1]
  def change
    add_column :settlements, :order_count, :integer, default: 0
    add_column :settlements, :payment_method, :string, default: 'bank_transfer'
  end
end
