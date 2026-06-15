class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email
      t.string :name
      t.string :phone
      t.integer :role
      t.string :avatar_url
      t.integer :status
      t.datetime :last_login_at

      t.timestamps
    end
  end
end
