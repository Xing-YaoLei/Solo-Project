class CreateEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :events do |t|
      t.string :name
      t.text :description
      t.datetime :start_time
      t.datetime :end_time
      t.string :location
      t.string :status

      t.timestamps
    end
  end
end
