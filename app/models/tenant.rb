class Tenant < ApplicationRecord
  has_many :tenant_contracts, dependent: :destroy
  has_many :parking_spots, through: :tenant_contracts

  validates :name, presence: true
  validates :contact_person, presence: true
  validates :contact_phone, presence: true
end
