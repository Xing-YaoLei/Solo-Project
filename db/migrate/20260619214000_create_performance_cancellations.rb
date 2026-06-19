class CreatePerformanceCancellations < ActiveRecord::Migration[8.1]
  def change
    create_table :performance_cancellations do |t|
      t.references :performance, null: false, foreign_key: true
      t.references :current_handler, foreign_key: { to_table: :users }
      t.text :reason
      t.integer :affected_audience_count, default: 0
      t.integer :affected_merchant_count, default: 0
      t.integer :status, default: 0
      t.text :resolution_notes
      t.datetime :resolved_at

      t.timestamps
    end

    add_index :performance_cancellations, :status
  end
end
