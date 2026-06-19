class CreateTicketTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :ticket_types do |t|
      t.references :performance, null: false, foreign_key: true
      t.string :name
      t.decimal :price
      t.text :description
      t.datetime :sale_start_time
      t.datetime :sale_end_time
      t.integer :max_quantity
      t.integer :min_quantity
      t.string :refund_policy
      t.string :status

      t.timestamps
    end
  end
end
