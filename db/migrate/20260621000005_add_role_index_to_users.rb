class AddRoleIndexToUsers < ActiveRecord::Migration[8.1]
  def change
    add_index :users, :role
    change_column_default :users, :role, from: nil, to: "staff"
  end
end
