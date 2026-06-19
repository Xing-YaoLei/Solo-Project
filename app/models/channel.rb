class Channel < ApplicationRecord
  has_many :price_rules, dependent: :destroy
  has_many :orders, dependent: :nullify

  enum :status, { active: "active", inactive: "inactive" }

  validates :name, :code, presence: true
  validates :code, uniqueness: true

  scope :active, -> { where(status: :active) }
end
