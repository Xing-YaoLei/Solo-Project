class ApprovalNode < ApplicationRecord
  belongs_to :parent, class_name: 'ApprovalNode', optional: true
  has_many :children, class_name: 'ApprovalNode', foreign_key: :parent_id, dependent: :destroy
  has_many :approval_records, dependent: :destroy

  validates :name, presence: true
  validates :order, numericality: { only_integer: true }

  scope :active, -> { where(active: true) }
  scope :by_role, ->(role) { where(approver_role: role) }
  scope :by_order, -> { order(order: :asc) }
  scope :root_nodes, -> { where(parent_id: nil) }
  scope :by_threshold, ->(amount) { where('threshold_amount <= ? OR threshold_amount IS NULL', amount) }

  def enabled?
    active?
  end

  def role_name
    {
      'cs' => '客服',
      'merchant' => '商户',
      'rider' => '骑手',
      'city_manager' => '城市经理',
      'admin' => '管理员',
      'finance' => '财务'
    }[approver_role] || approver_role
  end
end
