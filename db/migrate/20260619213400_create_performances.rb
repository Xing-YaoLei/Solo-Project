class CreatePerformances < ActiveRecord::Migration[8.1]
  def change
    create_table :performances do |t|
      t.string :name, null: false
      t.datetime :start_time
      t.datetime :end_time
      t.string :venue
      t.integer :total_seats, default: 0
      t.integer :status, default: 0
      t.text :description
      t.string :poster_image
      t.decimal :ticket_price, precision: 10, scale: 2

      t.timestamps
    end

    add_index :performances, :status
    add_index :performances, :start_time
    add_index :performances, :venue
  end
end
