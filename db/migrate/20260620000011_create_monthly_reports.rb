class CreateMonthlyReports < ActiveRecord::Migration[8.1]
  def change
    create_table :monthly_reports do |t|
      t.date :report_month
      t.references :property, null: false, foreign_key: true
      t.decimal :occupancy_rate
      t.integer :total_rooms
      t.integer :occupied_rooms
      t.decimal :total_revenue

      t.timestamps
    end
    add_index :monthly_reports, :report_month
  end
end
