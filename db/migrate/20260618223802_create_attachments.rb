class CreateAttachments < ActiveRecord::Migration[8.1]
  def change
    create_table :attachments do |t|
      t.references :work_order, null: false, foreign_key: true
      t.string :name
      t.string :file_type
      t.bigint :uploaded_by_id

      t.timestamps
    end
  end
end
