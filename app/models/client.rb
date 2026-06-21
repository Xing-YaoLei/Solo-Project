class Client < ApplicationRecord
  has_many :legal_cases, dependent: :restrict_with_error

  validates :name, presence: true
  validates :phone, presence: true

  SOURCE_CHANNELS = %w[线上推广 客户转介 律所合作 企业合作 其他].freeze

  scope :search, ->(keyword) {
    where("name ILIKE ? OR phone ILIKE ? OR id_number ILIKE ?", "%#{keyword}%", "%#{keyword}%", "%#{keyword}%") if keyword.present?
  }

  def display_name
    "#{name} (#{phone})"
  end
end
