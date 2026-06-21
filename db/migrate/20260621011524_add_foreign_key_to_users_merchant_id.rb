# frozen_string_literal: true

class AddForeignKeyToUsersMerchantId < ActiveRecord::Migration[8.1]
  def change
    add_foreign_key :users, :merchants, column: :merchant_id
  end
end
