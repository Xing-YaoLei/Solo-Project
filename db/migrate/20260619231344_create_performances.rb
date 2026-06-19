class CreatePerformances < ActiveRecord::Migration[8.1]
  def change
    create_table :performances do |t|
      t.string :name
      t.text :description
      t.datetime :start_time
      t.datetime :end_time
      t.string :venue
      t.string :status
      t.integer :total_seats

      t.timestamps
    end
  end
end
