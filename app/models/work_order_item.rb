class WorkOrderItem < ApplicationRecord
  STATUSES = %w[pending in_progress completed].freeze

  belongs_to :work_order
  belongs_to :technician, class_name: 'User', optional: true

  enum :status, STATUSES.zip(STATUSES).to_h

  def subtotal
    quantity * (unit_price.to_d + labor_fee.to_d)
  end
end
