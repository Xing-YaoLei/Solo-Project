class SettlementEvent < ApplicationRecord
  belongs_to :course_consumption

  validates :event_type, presence: true

  EVENT_TYPES = %w[
    status_changed submitted approved rejected processing_info_requested
    escalated settled reviewed closed note_added
  ].freeze

  scope :chronological, -> { order(created_at: :asc) }
end
