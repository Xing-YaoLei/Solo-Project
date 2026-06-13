class CreateMembers < ActiveRecord::Migration[7.2]
  def change
    create_table :members do |t|
      t.string :name, null: false
      t.string :phone
      t.string :member_no, null: false
      t.string :source_channel
      t.text :notes
      t.timestamps
    end
    add_index :members, :member_no, unique: true
    add_index :members, :source_channel
  end
end
