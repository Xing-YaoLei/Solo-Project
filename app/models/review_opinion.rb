class ReviewOpinion < ApplicationRecord
  belongs_to :document
  belongs_to :reviewer, class_name: 'User'

  validates :opinion, :result, presence: true
  validates :result, inclusion: { in: %w[approved rejected] }

  def result_name
    { 'approved' => '通过', 'rejected' => '退回' }[result]
  end
end
