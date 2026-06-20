class AddHandlerActionToDisputeLogs < ActiveRecord::Migration[8.1]
  def change
    add_column :dispute_logs, :handler_action, :string
    add_index :dispute_logs, :handler_action
  end
end
