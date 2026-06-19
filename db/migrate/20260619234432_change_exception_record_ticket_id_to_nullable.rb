class ChangeExceptionRecordTicketIdToNullable < ActiveRecord::Migration[8.1]
  def change
    change_column_null :exception_records, :ticket_id, true
    remove_foreign_key :exception_records, :tickets
    add_foreign_key :exception_records, :tickets, on_delete: :nullify
  end
end
