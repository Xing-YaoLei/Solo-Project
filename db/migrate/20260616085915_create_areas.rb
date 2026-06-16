class CreateAreas < ActiveRecord::Migration[8.1]
  def change
    create_table :areas do |t|
      t.string :name
      t.string :code

      t.timestamps
    end
  end
end
