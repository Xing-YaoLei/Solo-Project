# frozen_string_literal: true

class CreateFilterConfigs < ActiveRecord::Migration[8.1]
  def change
    create_table :filter_configs, id: :uuid do |t|
      t.uuid :user_id, null: false
      t.string :name, null: false
      t.string :target_model, null: false
      t.jsonb :conditions, default: {}
      t.boolean :is_default, default: false

      t.timestamps
    end

    add_index :filter_configs, :user_id
    add_index :filter_configs, :target_model
    add_index :filter_configs, :is_default
    add_foreign_key :filter_configs, :users, column: :user_id
  end
end
