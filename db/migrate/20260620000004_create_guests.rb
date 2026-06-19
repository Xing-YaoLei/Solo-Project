class CreateGuests < ActiveRecord::Migration[8.1]
  def change
    create_table :guests do |t|
      t.string :name
      t.string :phone
      t.string :id_number

      t.timestamps
    end
    add_index :guests, :id_number
  end
end
