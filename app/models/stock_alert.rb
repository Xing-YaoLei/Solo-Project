class StockAlert < ApplicationRecord
  STATUSES = %w[pending processing resolved].freeze

  belongs_to :part
  belongs_to :work_order
  belongs_to :work_order_part
  belongs_to :handler, class_name: 'User', optional: true
  belongs_to :reassigned_to, class_name: 'User', optional: true

  enum :status, STATUSES.zip(STATUSES).to_h

  def confirm_impact(scope_text, handler_id)
    self.affected_scope = scope_text
    self.handler_id = handler_id
    self.status = :processing
    save
  end

  def reassign(new_handler_id, note)
    self.reassigned_to_id = new_handler_id
    self.handler_id = new_handler_id
    self.supplementary_note = note
    save
  end
end
