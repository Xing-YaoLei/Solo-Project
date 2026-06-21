# frozen_string_literal: true

class CreateSupplementMaterials < ActiveRecord::Migration[8.1]
  def change
    create_table :supplement_materials, id: :uuid do |t|
      t.uuid :discrepancy_id, null: false
      t.uuid :uploader_id, null: false
      t.text :description
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :supplement_materials, :discrepancy_id
    add_index :supplement_materials, :uploader_id
    add_foreign_key :supplement_materials, :discrepancies, column: :discrepancy_id
    add_foreign_key :supplement_materials, :users, column: :uploader_id
  end
end
