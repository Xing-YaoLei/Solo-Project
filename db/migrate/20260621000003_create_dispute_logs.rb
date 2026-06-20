class CreateDisputeLogs < ActiveRecord::Migration[8.1]
  def change
    create_table :dispute_logs do |t|
      t.references :refund_dispute, null: false, foreign_key: true
      t.references :operator, null: false, foreign_key: { to_table: :users }
      t.string :action_type
      t.text :reason
      t.text :detail
      t.datetime :closed_at

      t.timestamps
    end
    add_index :dispute_logs, :action_type
  end
end
