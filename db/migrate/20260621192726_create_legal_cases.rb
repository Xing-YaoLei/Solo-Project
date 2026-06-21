class CreateLegalCases < ActiveRecord::Migration[8.1]
  def change
    create_table :legal_cases do |t|
      t.references :client, null: false, foreign_key: true
      t.string :title
      t.string :case_number
      t.string :category
      t.string :status
      t.string :responsible_person
      t.datetime :accept_date
      t.datetime :close_date
      t.decimal :amount
      t.text :description
      t.string :source_channel
      t.boolean :material_missing
      t.text :missing_details

      t.timestamps
    end
  end
end
