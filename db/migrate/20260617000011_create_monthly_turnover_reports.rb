class CreateMonthlyTurnoverReports < ActiveRecord::Migration[7.2]
  def change
    create_table :monthly_turnover_reports do |t|
      t.date :report_month, null: false
      t.string :generated_by, null: false
      t.jsonb :filter_conditions, null: false, default: {}
      t.datetime :generated_at, null: false
      t.string :file_url

      t.timestamps
    end

    add_index :monthly_turnover_reports, :report_month
  end
end
