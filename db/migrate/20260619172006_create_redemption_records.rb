class CreateRedemptionRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :redemption_records do |t|
      t.references :order, null: false, foreign_key: true
      t.references :staff, foreign_key: { to_table: :users }

      t.string :redemption_code, null: false
      t.datetime :redeemed_at
      t.string :status, null: false, default: "pending"
      t.text :notes

      t.timestamps
    end

    add_index :redemption_records, :redemption_code, unique: true
    add_index :redemption_records, :status
    add_index :redemption_records, :redeemed_at
  end
end
