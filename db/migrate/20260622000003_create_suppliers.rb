class CreateSuppliers < ActiveRecord::Migration[7.2]
  def change
    create_table :suppliers, id: :uuid do |t|
      t.string :name, null: false, limit: 200
      t.string :code, null: false, limit: 50
      t.string :contact_person, limit: 100
      t.string :phone, limit: 50
      t.string :email, limit: 100
      t.string :status, null: false, default: "active", limit: 20
      t.text :description
      t.uuid :created_by_id

      t.timestamps null: false

      t.index :code, unique: true
      t.index :name
      t.index :status
      t.index :created_by_id
    end

    add_foreign_key :suppliers, :users, column: :created_by_id
  end
end
