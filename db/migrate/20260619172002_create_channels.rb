class CreateChannels < ActiveRecord::Migration[8.1]
  def change
    create_table :channels do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.text :description
      t.string :status, null: false, default: "active"
      t.decimal :commission_rate, precision: 5, scale: 2, default: 0

      t.timestamps
    end

    add_index :channels, :code, unique: true
    add_index :channels, :status
  end
end
