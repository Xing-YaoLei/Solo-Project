class StatusTransition < ApplicationRecord
  belongs_to :legal_case

  scope :ordered, -> { order(created_at: :desc) }

  def status_label(to: true)
    status = to ? to_status : from_status
    case status.to_sym
    when :draft then "bg-gray-100 text-gray-800"
    when :pending then "bg-yellow-100 text-yellow-800"
    when :in_progress then "bg-blue-100 text-blue-800"
    when :material_missing then "bg-red-100 text-red-800"
    when :review_required then "bg-purple-100 text-purple-800"
    when :completed then "bg-green-100 text-green-800"
    when :closed then "bg-slate-200 text-slate-700"
    end
  end

  def status_text(status)
    I18n.t("activerecord.attributes.legal_case.statuses.#{status}", default: status.to_s)
  end
end
