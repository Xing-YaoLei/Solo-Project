class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  enum :role, { staff: "staff", manager: "manager" }

  validates :name, :role, presence: true
  validates :role, inclusion: { in: roles.keys }

  has_many :orders, foreign_key: :staff_id
  has_many :redemption_records, foreign_key: :staff_id
  has_many :oversell_communications, foreign_key: :user_id
  has_many :oversell_reviews, foreign_key: :reviewer_id

  def manager?
    role == "manager"
  end

  def staff?
    role == "staff"
  end
end
