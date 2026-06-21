class ExceptionOrder < ApplicationRecord
  include AASM

  belongs_to :document
  belongs_to :handler, class_name: 'User', optional: true

  validates :order_no, presence: true, uniqueness: true
  validates :status, presence: true

  before_validation :generate_order_no, on: :create

  aasm column: 'status', timestamps: false do
    state :pending, initial: true
    state :processing
    state :resolved
    state :closed

    event :start_processing do
      transitions from: :pending, to: :processing
    end

    event :resolve do
      transitions from: :processing, to: :resolved
    end

    event :close do
      transitions from: :resolved, to: :closed
    end

    event :reopen do
      transitions from: :closed, to: :processing
    end
  end

  def status_name
    {
      'pending' => '待处理',
      'processing' => '处理中',
      'resolved' => '已解决',
      'closed' => '已关闭'
    }[status] || status
  end

  private

  def generate_order_no
    return if order_no.present?

    date_str = Time.current.strftime('%Y%m%d')
    last_order = ExceptionOrder.where('order_no LIKE ?', "EXC-#{date_str}-%").order(order_no: :desc).first
    if last_order
      last_num = last_order.order_no.split('-').last.to_i
      new_num = format('%04d', last_num + 1)
    else
      new_num = '0001'
    end
    self.order_no = "EXC-#{date_str}-#{new_num}"
  end

  def self.ransackable_attributes(auth_object = nil)
    %w[order_no status impact_scope responsibility created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[document handler]
  end
end
