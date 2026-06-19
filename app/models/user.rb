class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  enum :role, { staff: 0, operator: 1, manager: 2, admin: 3 }, default: :staff

  has_many :processing_records, foreign_key: :handler_id
  has_many :assigned_todos, class_name: "Todo", foreign_key: :assignee_id
  has_many :created_todos, class_name: "Todo", foreign_key: :creator_id
  has_many :exports, dependent: :destroy

  validates :name, presence: true
end
