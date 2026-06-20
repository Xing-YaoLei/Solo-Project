class AddHandlerActionToRefundDisputes < ActiveRecord::Migration[8.1]
  def change
    add_column :refund_disputes, :handler_action, :string
    add_column :refund_disputes, :handler_remark, :text
  end
end
