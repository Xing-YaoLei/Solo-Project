class Merchant < ApplicationRecord
  has_many :users, foreign_key: :merchant_id
  has_many :settlements
  has_many :delivery_orders
  has_many :contract_attachments

  validates :name, presence: true

  scope :by_city, ->(city_id) { where(city_id: city_id) }
  scope :active, -> { where(active: true) }
  scope :search_by_name, ->(keyword) { where('name LIKE ?', "%#{keyword}%") }
end
