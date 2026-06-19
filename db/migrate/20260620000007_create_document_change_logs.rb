class CreateDocumentChangeLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :document_change_logs do |t|
      t.references :check_in_document, null: false, foreign_key: true
      t.references :operator, null: false, foreign_key: { to_table: :users }
      t.string :changed_field
      t.string :old_value
      t.string :new_value

      t.timestamps
    end
  end
end
