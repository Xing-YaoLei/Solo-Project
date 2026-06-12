class StatusLog < ApplicationRecord
  belongs_to :waste_report

  STATUS_TEXT = {
    "submitted" => "已提交",
    "reviewing" => "复核中",
    "approved" => "已审批",
    "rejected" => "已驳回",
    "settled" => "已结算"
  }.freeze

  def from_status_text
    STATUS_TEXT[from_status] || from_status.to_s
  end

  def to_status_text
    STATUS_TEXT[to_status] || to_status.to_s
  end
end
