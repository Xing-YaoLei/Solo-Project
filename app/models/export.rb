class Export < ApplicationRecord
  enum :status, { pending: 0, processing: 1, completed: 2, failed: 3 }, default: :pending

  belongs_to :user
  has_one_attached :file

  validates :export_type, presence: true

  scope :recent, -> { order(created_at: :desc) }

  def self.ransackable_attributes(auth_object = nil)
    %w[created_at export_type id status updated_at user_id]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[user file_attachment file_blob]
  end

  EXPORT_TYPES = %w[
    heat_points
    guide_contents
    performances
    merchant_contracts
    processing_records
    secondary_consumptions
    todos
  ].freeze

  def display_name
    case export_type
    when "heat_points" then "热力点位"
    when "guide_contents" then "导览内容"
    when "performances" then "演出信息"
    when "merchant_contracts" then "商户合同"
    when "processing_records" then "处理记录"
    when "secondary_consumptions" then "二消数据"
    when "todos" then "待办事项"
    else export_type.humanize
    end
  end
end
