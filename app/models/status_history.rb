class StatusHistory < ApplicationRecord
  belongs_to :document
  belongs_to :operator, class_name: 'User'

  validates :from_status, :to_status, presence: true

  scope :ordered, -> { order(created_at: :desc) }

  def from_status_name
    Document.new(status: from_status).status_name rescue from_status
  end

  def to_status_name
    Document.new(status: to_status).status_name rescue to_status
  end
end
