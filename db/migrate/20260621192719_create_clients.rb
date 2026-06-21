class CreateClients < ActiveRecord::Migration[8.1]
  def change
    create_table :clients do |t|
      t.string :name
      t.string :phone
      t.string :id_number
      t.string :email
      t.text :address
      t.string :source_channel
      t.string :contact_person
      t.text :notes

      t.timestamps
    end
  end
end
