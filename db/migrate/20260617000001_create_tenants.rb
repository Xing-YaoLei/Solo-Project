class CreateTenants < ActiveRecord::Migration[7.2]
  def change
    create_table :tenants do |t|
      t.string :name, null: false
      t.string :contact_person, null: false
      t.string :contact_phone, null: false
      t.string :email
      t.string :address
      t.text :remark

      t.timestamps
    end
  end
end
