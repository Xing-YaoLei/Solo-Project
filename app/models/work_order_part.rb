class WorkOrderPart < ApplicationRecord
  belongs_to :work_order
  belongs_to :part
  belongs_to :shortage_handled_by, class_name: 'User', optional: true
  has_many :stock_alerts, dependent: :destroy

  scope :out_of_stock, -> { where(is_out_of_stock: true) }

  after_save :check_stock_and_alert, if: :is_out_of_stock?

  def subtotal
    quantity * unit_price.to_d
  end

  private

  def check_stock_and_alert
    stock_alerts.create!(
      part: part,
      work_order: work_order
    ) unless stock_alerts.exists?
  end
end
