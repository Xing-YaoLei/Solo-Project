class Channel < ApplicationRecord
  enum :status, { active: 0, inactive: 1 }

  has_many :courses
  has_many :orders
  has_many :enrollments
  has_many :channel_commissions

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true
  validates :commission_rate, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 1 }

  def commission_amount_for(amount)
    amount.to_d * commission_rate.to_d
  end
end
