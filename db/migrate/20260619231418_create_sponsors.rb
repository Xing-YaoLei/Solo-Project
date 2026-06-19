class CreateSponsors < ActiveRecord::Migration[8.1]
  def change
    create_table :sponsors do |t|
      t.string :name
      t.string :contact_person
      t.string :contact_phone
      t.string :contact_email
      t.string :address
      t.string :status

      t.timestamps
    end
  end
end
