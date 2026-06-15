class CreateChannels < ActiveRecord::Migration[8.1]
  def change
    create_table :channels do |t|
      t.string :name
      t.string :code
      t.string :contact_name
      t.string :contact_phone
      t.decimal :commission_rate
      t.integer :status

      t.timestamps
    end
  end
end
