class DenialAction < ApplicationRecord
  belongs_to :settlement
  belongs_to :operator, class_name: 'User'

  enum :action_type, { supplement: 'supplement', retry: 'retry', close: 'close' }
end
