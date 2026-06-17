class AddStatusToMonthlyTurnoverReports < ActiveRecord::Migration[7.2]
  def change
    add_column :monthly_turnover_reports, :status, :string, default: "pending"
    add_column :monthly_turnover_reports, :error_message, :text
  end
end
