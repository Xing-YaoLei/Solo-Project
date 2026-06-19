class CreateTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets do |t|
      t.references :order, null: false, foreign_key: true
      t.references :ticket_type, null: false, foreign_key: true
      t.references :seat, null: false, foreign_key: true
      t.string :ticket_no
      t.string :status
      t.datetime :checked_in_at

      t.timestamps
    end
  end
end
