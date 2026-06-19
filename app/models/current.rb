class Current < ActiveSupport::CurrentAttributes
  attribute :operator, :transition_reason, :transition_metadata
end
