class FixStatusLogsColumnTypes < ActiveRecord::Migration[8.1]
  def up
    StatusLog.delete_all

    change_column :status_logs, :from_status, :string
    change_column :status_logs, :to_status, :string

    add_index :status_logs, :from_status
    add_index :status_logs, :to_status
  end

  def down
    remove_index :status_logs, :to_status
    remove_index :status_logs, :from_status

    change_column :status_logs, :from_status, :integer
    change_column :status_logs, :to_status, :integer
  end
end
