class StatusLog < ApplicationRecord
  belongs_to :trackable, polymorphic: true

  validates :event, presence: true
  validates :from_state, presence: true
  validates :to_state, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :for_trackable, ->(trackable) { where(trackable: trackable) }

  def self.log_transition!(trackable, event:, from_state:, to_state:, operator: "system", reason: nil, metadata: nil)
    create!(
      trackable: trackable,
      event: event,
      from_state: from_state,
      to_state: to_state,
      operator: operator,
      reason: reason,
      metadata: metadata
    )
  end

  def display_event
    "#{from_state} → #{to_state} (#{event})"
  end
end
