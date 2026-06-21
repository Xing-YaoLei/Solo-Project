class CreateContentVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :content_versions do |t|
      t.references :document, null: false, foreign_key: true
      t.integer :version
      t.text :content
      t.references :editor, null: false, foreign_key: { to_table: :users }
      t.string :change_summary

      t.timestamps
    end
  end
end
