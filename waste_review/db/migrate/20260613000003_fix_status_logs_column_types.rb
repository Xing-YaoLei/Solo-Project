class FixStatusLogsColumnTypes < ActiveRecord::Migration[8.1]
  STATUS_INT_TO_STR = {
    0 => "submitted",
    1 => "reviewing",
    2 => "approved",
    3 => "rejected",
    4 => "settled"
  }.freeze

  def up
    existing_logs = StatusLog.all.to_a

    change_column :status_logs, :from_status, :string
    change_column :status_logs, :to_status, :string

    add_index :status_logs, :from_status
    add_index :status_logs, :to_status

    existing_logs.each do |log|
      from_str = STATUS_INT_TO_STR[log.read_attribute_before_type_cast(:from_status).to_i] || log.from_status.to_s
      to_str = STATUS_INT_TO_STR[log.read_attribute_before_type_cast(:to_status).to_i] || log.to_status.to_s
      StatusLog.where(id: log.id).update_all(from_status: from_str, to_status: to_str)
    end
  end

  def down
    remove_index :status_logs, :to_status
    remove_index :status_logs, :from_status

    STATUS_STR_TO_INT = STATUS_INT_TO_STR.invert

    StatusLog.find_each do |log|
      from_int = STATUS_STR_TO_INT[log.from_status] || 0
      to_int = STATUS_STR_TO_INT[log.to_status] || 0
      StatusLog.where(id: log.id).update_all(from_status: from_int, to_status: to_int)
    end

    change_column :status_logs, :from_status, :integer
    change_column :status_logs, :to_status, :integer
  end
end
