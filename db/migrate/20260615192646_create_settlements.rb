class CreateSettlements < ActiveRecord::Migration[8.1]
  def change
    create_table :settlements do |t|
      t.date :period_start
      t.date :period_end
      t.integer :status
      t.integer :total_orders
      t.decimal :total_amount
      t.integer :completed_courses_count
      t.integer :passed_exams_count
      t.integer :refund_count
      t.decimal :refund_amount
      t.decimal :channel_commission_amount
      t.decimal :net_revenue
      t.datetime :settled_at

      t.timestamps
    end
  end
end
