class ShortageRecord < ApplicationRecord
  REASONS = %w[供应商缺货 仓库漏发 运输丢失 破损丢弃 客户取消 其他].freeze
  HANDLING_METHODS = %w[退款 补发 补偿 客户同意 其他].freeze
  STATUSES = %w[pending handled].freeze

  belongs_to :pickup_order
  belongs_to :pickup_item
  belongs_to :handled_by, class_name: 'User', optional: true

  validates :shortage_quantity, presence: true, numericality: { greater_than: 0 }
  validates :reason, presence: true, inclusion: { in: REASONS }
  validates :handling_method, inclusion: { in: HANDLING_METHODS }, allow_nil: true
  validates :status, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: 'pending') }
  scope :handled, -> { where(status: 'handled') }

  def self.ransackable_attributes(auth_object = nil)
    ["compensation_amount", "created_at", "handled_at", "handling_method", "id", "pickup_item_id", "pickup_order_id", "reason", "remark", "status", "updated_at"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["handled_by", "pickup_item", "pickup_order"]
  end

  def pending?
    status == 'pending'
  end

  def handled?
    status == 'handled'
  end

  def reason_display
    reason
  end

  def handling_method_display
    handling_method
  end

  def status_display
    {
      'pending' => '待处理',
      'handled' => '已处理'
    }[status] || status
  end

  def mark_handled!(user:, handling_method:, compensation_amount: 0, remark: nil)
    update!(
      status: 'handled',
      handled_by: user,
      handling_method: handling_method,
      compensation_amount: compensation_amount,
      handled_at: Time.current,
      remark: remark
    )
  end
end
