class CleaningTask < ApplicationRecord
  STATUSES = %w[pending in_progress completed cancelled].freeze
  PRIORITIES = %w[low medium high urgent].freeze

  belongs_to :property
  belongs_to :assignee, class_name: "User", optional: true

  validates :task_date, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :priority, inclusion: { in: PRIORITIES }, allow_nil: true

  scope :for_date, ->(date) { where(task_date: date) }
  scope :for_property, ->(property_id) { where(property_id: property_id) }
  scope :pending, -> { where(status: "pending") }
  scope :in_progress, -> { where(status: "in_progress") }

  def status_i18n
    I18n.t("cleaning_statuses.#{status}", default: status)
  end

  def priority_i18n
    I18n.t("priorities.#{priority}", default: priority) if priority.present?
  end

  def status_color
    case status
    when "pending" then "bg-yellow-100 text-yellow-800"
    when "in_progress" then "bg-blue-100 text-blue-800"
    when "completed" then "bg-green-100 text-green-800"
    when "cancelled" then "bg-gray-100 text-gray-800"
    else "bg-gray-100 text-gray-800"
    end
  end

  def priority_color
    case priority
    when "low" then "text-green-600"
    when "medium" then "text-yellow-600"
    when "high" then "text-orange-600"
    when "urgent" then "text-red-600"
    else "text-gray-600"
    end
  end
end
