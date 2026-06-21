class ContractAttachment < ApplicationRecord
  belongs_to :merchant
  belongs_to :uploader, class_name: 'User'

  has_one_attached :file

  validates :file_name, presence: true
  validates :file_type, presence: true

  scope :by_merchant, ->(merchant_id) { where(merchant_id: merchant_id) }
  scope :by_file_type, ->(file_type) { where(file_type: file_type) }
  scope :active, -> { where('effective_date <= ? AND (expiry_date IS NULL OR expiry_date >= ?)', Date.today, Date.today) }
  scope :expired, -> { where('expiry_date < ?', Date.today) }
  scope :recent, -> { order(created_at: :desc) }
end
