module StatusLoggable
  extend ActiveSupport::Concern

  included do
    after_save :log_status_transition, if: -> { respond_to?(:aasm) && aasm.current_event }

    has_many :status_logs, as: :trackable, dependent: :nullify
  end

  private

  def log_status_transition
    return unless respond_to?(:aasm) && aasm.current_event

    status_logs.create!(
      event: aasm.current_event.to_s.gsub("!", ""),
      from_state: aasm.from_state,
      to_state: aasm.to_state,
      operator: Current.operator || "system",
      reason: Current.transition_reason,
      metadata: Current.transition_metadata ? Current.transition_metadata.to_json : "{}"
    )
  end
end
