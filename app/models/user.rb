class User < ApplicationRecord
  has_secure_password

  has_many :created_documents, class_name: 'Document', foreign_key: 'creator_id'
  has_many :reviewed_documents, class_name: 'Document', foreign_key: 'reviewer_id'
  has_many :review_opinions, foreign_key: 'reviewer_id'
  has_many :interaction_records, foreign_key: 'operator_id'
  has_many :content_versions, foreign_key: 'editor_id'
  has_many :status_histories, foreign_key: 'operator_id'
  has_many :handled_exception_orders, class_name: 'ExceptionOrder', foreign_key: 'handler_id'

  validates :name, :email, presence: true
  validates :email, uniqueness: true
  validates :role, inclusion: { in: %w[creator reviewer admin] }

  def role_name
    { 'creator' => '文书制作', 'reviewer' => '审核员', 'admin' => '管理员' }[role] || role
  end
end
