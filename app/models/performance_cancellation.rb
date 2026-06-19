class PerformanceCancellation < ApplicationRecord
  enum :status, { reported: 0, in_progress: 1, resolved: 2, closed: 3 }, default: :reported

  belongs_to :performance
  belongs_to :current_handler, class_name: "User", optional: true
  has_many :processing_records, as: :recordable
  has_many :todos, as: :source

  validates :reason, presence: true

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_handler, ->(handler_id) { where(current_handler_id: handler_id) if handler_id.present? }
  scope :recent, -> { order(created_at: :desc) }
  scope :open, -> { where(status: [:reported, :in_progress]) }

  def self.ransackable_attributes(auth_object = nil)
    %w[affected_audience_count affected_merchant_count created_at current_handler_id id performance_id reason resolution_notes resolved_at status updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[current_handler performance processing_records todos]
  end

  def take_over(user, notes = nil)
    return false if user.blank?

    ActiveRecord::Base.transaction do
      self.current_handler = user
      self.status = :in_progress

      if save
        processing_records.create!(
          handler: user,
          action_type: "take_over",
          status: :in_progress,
          notes: notes || "接手处理"
        )
        true
      else
        false
      end
    end
  end

  def add_supplementary_notes(user, notes)
    return false if notes.blank?

    processing_records.create(
      handler: user,
      action_type: "supplementary",
      status: status,
      notes: notes
    )
  end

  def change_handler(user, new_handler, reason = nil)
    return false if new_handler.blank?

    old_handler = current_handler

    ActiveRecord::Base.transaction do
      self.current_handler = new_handler

      if save
        processing_records.create!(
          handler: user,
          action_type: "change_handler",
          status: status,
          notes: "责任人由 #{old_handler&.name || '未分配'} 变更为 #{new_handler.name}。#{reason}"
        )
        true
      else
        false
      end
    end
  end

  def resolve(user, resolution_notes)
    return false if resolution_notes.blank?

    ActiveRecord::Base.transaction do
      self.status = :resolved
      self.resolution_notes = resolution_notes
      self.resolved_at = Time.current

      if save
        processing_records.create!(
          handler: user,
          action_type: "resolve",
          status: :resolved,
          notes: resolution_notes
        )
        true
      else
        false
      end
    end
  end
end
