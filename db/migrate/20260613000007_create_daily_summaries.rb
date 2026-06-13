class CreateDailySummaries < ActiveRecord::Migration[7.2]
  def change
    create_table :daily_summaries do |t|
      t.date :summary_date, null: false
      t.string :source
      t.integer :total_orders, default: 0
      t.integer :completed_orders, default: 0
      t.integer :on_time_orders, default: 0
      t.integer :delayed_orders, default: 0
      t.integer :shortage_orders, default: 0
      t.decimal :on_time_rate, precision: 5, scale: 2, default: 0
      t.jsonb :operator_stats, default: {}
      t.jsonb :abnormal_reason_stats, default: {}
      t.jsonb :product_tag_stats, default: {}

      t.timestamps
    end
    add_index :daily_summaries, [:summary_date, :source], unique: true
  end
end
