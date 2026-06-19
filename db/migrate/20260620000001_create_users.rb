class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name
      t.string :email
      t.string :role
      t.string :phone

      t.timestamps
    end
    add_index :users, :role
  end
end
