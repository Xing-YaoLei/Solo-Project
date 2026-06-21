class CaseStage < ApplicationRecord
  belongs_to :legal_case

  STATUSES = %w[pending in_progress completed skipped].freeze

  validates :name, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :ordered, -> { order(order: :asc) }

  def status_label
    case status
    when "pending" then "bg-gray-100 text-gray-800"
    when "in_progress" then "bg-blue-100 text-blue-800"
    when "completed" then "bg-green-100 text-green-800"
    when "skipped" then "bg-slate-100 text-slate-600"
    end
  end

  def status_text
    case status
    when "pending" then "未开始"
    when "in_progress" then "进行中"
    when "completed" then "已完成"
    when "skipped" then "已跳过"
    end
  end
end
