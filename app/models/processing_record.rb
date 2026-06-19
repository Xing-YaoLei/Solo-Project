class ProcessingRecord < ApplicationRecord
  enum :status, { pending: 0, in_progress: 1, completed: 2, cancelled: 3 }, default: :pending

  belongs_to :recordable, polymorphic: true
  belongs_to :handler, class_name: "User"

  has_many_attached :attachments

  validates :action_type, presence: true
  validates :handler, presence: true

  scope :by_recordable, ->(recordable) { where(recordable: recordable) if recordable.present? }
  scope :by_handler, ->(handler_id) { where(handler_id: handler_id) if handler_id.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_date_range, ->(start_date, end_date) {
    if start_date.present? && end_date.present?
      where(created_at: start_date.beginning_of_day..end_date.end_of_day)
    end
  }

  def self.ransackable_attributes(auth_object = nil)
    %w[action_type created_at handler_id id next_status notes previous_status recordable_id recordable_type status updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[attachments_attachments attachments_blobs handler recordable]
  end

  def status_change?
    previous_status.present? && next_status.present? && previous_status.to_s != next_status.to_s
  end

  def apply_status_change!
    return unless status_change? && recordable.respond_to?(:status=) && recordable.class.respond_to?(:statuses)

    if recordable.class.statuses.key?(next_status.to_s)
      recordable.update!(status: next_status.to_s)
    end
  end
end
