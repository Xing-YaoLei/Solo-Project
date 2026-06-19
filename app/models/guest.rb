class Guest < ApplicationRecord
  has_many :channel_orders, dependent: :nullify
  has_many :check_in_documents, dependent: :destroy

  validates :name, presence: true
  validates :phone, presence: true
  validates :id_number, uniqueness: true, allow_blank: true
end
