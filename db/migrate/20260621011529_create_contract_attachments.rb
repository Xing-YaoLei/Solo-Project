# frozen_string_literal: true

class CreateContractAttachments < ActiveRecord::Migration[8.1]
  def change
    create_table :contract_attachments, id: :uuid do |t|
      t.uuid :merchant_id, null: false
      t.uuid :uploader_id, null: false
      t.string :file_type
      t.string :file_name
      t.string :version
      t.datetime :effective_date
      t.datetime :expiry_date

      t.timestamps
    end

    add_index :contract_attachments, :merchant_id
    add_index :contract_attachments, :uploader_id
    add_index :contract_attachments, :file_type
    add_index :contract_attachments, :effective_date
    add_index :contract_attachments, :expiry_date
    add_foreign_key :contract_attachments, :merchants, column: :merchant_id
    add_foreign_key :contract_attachments, :users, column: :uploader_id
  end
end
