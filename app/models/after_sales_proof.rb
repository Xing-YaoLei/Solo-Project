class AfterSalesProof < ApplicationRecord
  PROOF_TYPES = %w[到货照片 缺货照片 破损照片 客户签字 其他凭证].freeze

  belongs_to :pickup_order
  belongs_to :pickup_item, optional: true
  belongs_to :uploaded_by, class_name: 'User', optional: true

  has_one_attached :document

  validates :proof_type, presence: true, inclusion: { in: PROOF_TYPES }

  def proof_type_display
    proof_type
  end
end
