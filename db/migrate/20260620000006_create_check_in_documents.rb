class CreateCheckInDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :check_in_documents do |t|
      t.references :channel_order, null: false, foreign_key: true
      t.references :guest, null: false, foreign_key: true
      t.string :id_type
      t.string :id_number
      t.string :name
      t.string :gender
      t.string :nationality

      t.timestamps
    end
  end
end
