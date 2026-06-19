class TimelineEvent < ApplicationRecord
  EVENT_TYPES = %w[status_change note_added part_shortage photo_added quote_created quote_approved work_order_created assignment_change].freeze

  belongs_to :work_order
  belongs_to :user, class_name: 'User', optional: true

  enum :event_type, EVENT_TYPES.zip(EVENT_TYPES).to_h
end
