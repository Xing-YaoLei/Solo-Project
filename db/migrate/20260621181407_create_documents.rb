class CreateDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :documents do |t|
      t.string :title
      t.string :doc_type
      t.text :content
      t.string :status
      t.references :creator, null: false, foreign_key: { to_table: :users }
      t.references :reviewer, null: true, foreign_key: { to_table: :users }
      t.datetime :archived_at

      t.timestamps
    end
  end
end
