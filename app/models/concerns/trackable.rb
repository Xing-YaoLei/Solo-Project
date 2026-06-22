module Trackable
  extend ActiveSupport::Concern

  included do
    def log_transition(operator, from_state, to_state, remark = nil, metadata = {})
      log_attrs = {
        operator: operator,
        from_state: from_state,
        to_state: to_state,
        remark: remark,
        metadata: metadata
      }

      if self.is_a?(Audit)
        log_attrs[:audit] = self
        state_transition_logs.create!(log_attrs)
      elsif self.is_a?(ExceptionOrder)
        log_attrs[:exception_id] = id
        state_transition_logs.create!(log_attrs)
      else
        raise ArgumentError, "Trackable concern only supports Audit and ExceptionOrder models"
      end
    end
  end
end
