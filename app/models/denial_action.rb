class DenialAction < ApplicationRecord
  belongs_to :settlement
  belongs_to :operator, class_name: 'User'

  enum :action_type, { deny: 'deny', supplement: 'supplement', retry: 'retry', close: 'close' }

  scope :by_settlement, ->(settlement_id) { where(settlement_id: settlement_id) }
end
