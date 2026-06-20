class CreateSponsors < ActiveRecord::Migration[8.1]
  def change
    create_table :sponsors do |t|
      t.references :event, null: false, foreign_key: true
      t.string :name
      t.string :logo
      t.string :level
      t.text :description
      t.string :contact_name
      t.string :contact_phone
      t.string :contact_email

      t.timestamps
    end
  end
end
