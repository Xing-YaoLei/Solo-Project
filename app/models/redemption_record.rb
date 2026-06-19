class RedemptionRecord < ApplicationRecord
  belongs_to :order
  belongs_to :staff, class_name: "User", optional: true

  enum :status, { pending: "pending",
                 redeemed: "redeemed",
                 expired: "expired" }

  validates :redemption_code, presence: true, uniqueness: true
  validates :order, presence: true

  before_validation :generate_redemption_code, on: :create

  scope :redeemed_today, -> { redeemed.where("DATE(redeemed_at) = ?", Date.today) }

  def redeem!(staff = nil)
    return false unless pending?

    update!(status: :redeemed, redeemed_at: Time.current, staff: staff)
  end

  private

  def generate_redemption_code
    return if redemption_code.present?

    loop do
      self.redemption_code = "R#{SecureRandom.alphanumeric(8).upcase}"
      break unless RedemptionRecord.exists?(redemption_code: redemption_code)
    end
  end
end
