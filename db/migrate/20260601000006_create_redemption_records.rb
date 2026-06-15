class CreateRedemptionRecords < ActiveRecord::Migration[7.2]
  def change
    create_table :redemption_records do |t|
      t.references :student, null: false, foreign_key: true
      t.references :benefit_rule, foreign_key: true
      t.references :operator, foreign_key: { to_table: :users }
      t.string :benefit_name
      t.string :redemption_code
      t.datetime :redeemed_at
      t.string :channel
      t.string :status, default: "pending"
      t.integer :points_used, default: 0
      t.text :notes
      t.timestamps
    end
    add_index :redemption_records, :status
    add_index :redemption_records, :redeemed_at
  end
end
