class AddDescriptionToSettlementItems < ActiveRecord::Migration[8.1]
  def change
    add_column :settlement_items, :description, :text
  end
end
