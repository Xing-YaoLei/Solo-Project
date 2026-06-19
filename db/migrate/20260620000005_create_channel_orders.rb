class CreateChannelOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :channel_orders do |t|
      t.string :order_no
      t.references :property, null: false, foreign_key: true
      t.references :guest, null: false, foreign_key: true
      t.date :check_in
      t.date :check_out
      t.string :channel
      t.string :status
      t.decimal :price
      t.integer :guest_count

      t.timestamps
    end
    add_index :channel_orders, :order_no
    add_index :channel_orders, :status
  end
end
