class QaThread < ApplicationRecord
  enum :status, { open: 0, answered: 1, closed: 2 }

  belongs_to :enrollment
  belongs_to :lesson, optional: true
  belongs_to :user
  has_many :qa_replies, dependent: :destroy

  validates :enrollment_id, presence: true
  validates :user_id, presence: true
  validates :title, presence: true
  validates :content, presence: true

  scope :unanswered, -> { where(status: :open) }
  scope :my_threads, ->(user) { where(user: user) }

  def has_instructor_reply?
    qa_replies.where(is_instructor: true).exists?
  end

  def latest_reply
    qa_replies.order(created_at: :desc).first
  end
end
