# frozen_string_literal: true

class CreateMerchants < ActiveRecord::Migration[8.1]
  def change
    create_table :merchants, id: :uuid do |t|
      t.string :name, null: false
      t.string :contact
      t.string :phone
      t.integer :city_id
      t.jsonb :settlement_config, default: {}

      t.timestamps
    end

    add_index :merchants, :city_id
    add_index :merchants, :name
  end
end
