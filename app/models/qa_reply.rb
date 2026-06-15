class QaReply < ApplicationRecord
  belongs_to :qa_thread
  belongs_to :user

  validates :qa_thread_id, presence: true
  validates :user_id, presence: true
  validates :content, presence: true

  after_create :update_thread_status

  private

  def update_thread_status
    if is_instructor?
      qa_thread.answered! if qa_thread.open?
    end
    qa_thread.update(last_reply_at: Time.current)
  end
end
