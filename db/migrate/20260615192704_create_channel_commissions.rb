class CreateChannelCommissions < ActiveRecord::Migration[8.1]
  def change
    create_table :channel_commissions do |t|
      t.references :channel, null: false, foreign_key: true
      t.references :order, null: false, foreign_key: true
      t.references :settlement, null: false, foreign_key: true
      t.decimal :amount
      t.decimal :commission_rate
      t.decimal :commission_amount
      t.integer :status
      t.datetime :settled_at

      t.timestamps
    end
  end
end
